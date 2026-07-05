import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Resend } from 'npm:resend@3.2.0';

// ============================================
// CONSTANTS
// ============================================
const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'yahoo.com', 'techtide.co'];
const MIN_PASSWORD_LENGTH = 16;
const MAX_RETRIES = 3;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const MAX_INVITES_PER_WINDOW = 10;

// ============================================
// CORS HEADERS
// ============================================
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// ============================================
// MAIN HANDLER
// ============================================
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return createResponse({ error: 'Method not allowed' }, 405);
  }

  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // ============================================
    // 1. PARSE & VALIDATE REQUEST BODY
    // ============================================
    let body;
    try {
      body = await req.json();
    } catch {
      return createResponse({ error: 'Invalid JSON body' }, 400);
    }

    const { email, fullName, disciplineId, sendEmail = true } = body;

    // ============================================
    // 2. FIELD VALIDATION
    // ============================================
    const validationErrors = [];

    // Email validation
    if (!email || typeof email !== 'string') {
      validationErrors.push('Email is required');
    } else if (!isValidEmail(email)) {
      validationErrors.push('Invalid email format');
    } else if (!isAllowedDomain(email)) {
      validationErrors.push(`Email domain not allowed. Allowed: ${ALLOWED_DOMAINS.join(', ')}`);
    }

    // Full name validation
    if (!fullName || typeof fullName !== 'string') {
      validationErrors.push('Full name is required');
    } else if (fullName.trim().length < 2) {
      validationErrors.push('Full name must be at least 2 characters');
    } else if (fullName.trim().length > 100) {
      validationErrors.push('Full name must be under 100 characters');
    } else if (!/^[a-zA-Z\s'-]+$/.test(fullName.trim())) {
      validationErrors.push('Full name contains invalid characters');
    }

    // Discipline validation
    if (!disciplineId || typeof disciplineId !== 'string') {
      validationErrors.push('Discipline is required');
    } else if (!isValidUUID(disciplineId)) {
      validationErrors.push('Invalid discipline ID format');
    }

    if (validationErrors.length > 0) {
      return createResponse({ 
        error: 'Validation failed', 
        details: validationErrors 
      }, 400);
    }

    // Sanitize inputs
    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedName = fullName.trim().replace(/\s+/g, ' ');

    // ============================================
    // 3. INITIALIZE SERVICES
    // ============================================
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { 
        auth: { 
          autoRefreshToken: false, 
          persistSession: false 
        } 
      }
    );

    // Initialize Resend if API key is available
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const resend = resendApiKey ? new Resend(resendApiKey) : null;

    // ============================================
    // 4. RATE LIMITING
    // ============================================
    const { data: recentInvites } = await supabaseAdmin
      .from('profiles')
      .select('created_at')
      .gte('created_at', new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString())
      .order('created_at', { ascending: false });

    if (recentInvites && recentInvites.length >= MAX_INVITES_PER_WINDOW) {
      return createResponse({ 
        error: `Rate limit exceeded. Maximum ${MAX_INVITES_PER_WINDOW} invites per minute.` 
      }, 429);
    }

    // ============================================
    // 5. CHECK EXISTING USER
    // ============================================
    const { data: existingProfile } = await supabaseAdmin
      .from('profiles')
      .select('id, email, role')
      .eq('email', sanitizedEmail)
      .maybeSingle();

    if (existingProfile) {
      return createResponse({ 
        error: 'User already exists',
        details: {
          email: sanitizedEmail,
          role: existingProfile.role,
          message: existingProfile.role === 'admin' 
            ? 'This email belongs to an admin account' 
            : 'An intern with this email already exists'
        }
      }, 409);
    }

    // Also check auth.users directly
    const { data: existingAuthUser } = await supabaseAdmin.auth.admin
      .listUsers({ page: 1, perPage: 1 })
      .then(({ data }) => ({
        data: data?.users?.find(u => u.email === sanitizedEmail) || null
      }));

    if (existingAuthUser) {
      return createResponse({ 
        error: 'User already exists in auth system but not in profiles' 
      }, 409);
    }

    // ============================================
    // 6. VALIDATE DISCIPLINE EXISTS
    // ============================================
    const { data: discipline, error: disciplineError } = await supabaseAdmin
      .from('disciplines')
      .select('id, name, description')
      .eq('id', disciplineId)
      .single();

    if (disciplineError || !discipline) {
      return createResponse({ 
        error: 'Discipline not found',
        details: 'The selected discipline does not exist'
      }, 404);
    }

    // ============================================
    // 7. GENERATE SECURE PASSWORD
    // ============================================
    const tempPassword = generateSecurePassword(MIN_PASSWORD_LENGTH);

    // ============================================
    // 8. CREATE AUTH USER
    // ============================================
    let authUser;
    let authError;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      const result = await supabaseAdmin.auth.admin.createUser({
        email: sanitizedEmail,
        password: tempPassword,
        email_confirm: true, // Skip email verification
        user_metadata: {
          full_name: sanitizedName,
          role: 'intern',
          discipline_id: disciplineId,
          discipline_name: discipline.name,
          invited_at: new Date().toISOString(),
        },
      });

      if (!result.error) {
        authUser = result.data;
        break;
      }

      authError = result.error;

      // Don't retry on certain errors
      if (result.error.message?.includes('already exists') || 
          result.error.message?.includes('invalid email')) {
        break;
      }

      if (attempt < MAX_RETRIES) {
        console.log(`Auth creation attempt ${attempt} failed, retrying...`);
        await sleep(1000 * attempt); // Exponential backoff
      }
    }

    if (!authUser) {
      console.error('Auth creation failed after retries:', authError);
      return createResponse({ 
        error: 'Failed to create user account',
        details: authError?.message || 'Unknown error'
      }, 500);
    }

    // ============================================
    // 9. UPDATE PROFILE WITH DISCIPLINE
    // ============================================
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        full_name: sanitizedName,
        discipline_id: disciplineId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authUser.user.id);

    if (profileError) {
      // Rollback: delete the auth user if profile update fails
      console.error('Profile update failed, rolling back:', profileError);
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
      
      return createResponse({ 
        error: 'Failed to set up user profile',
        details: profileError.message
      }, 500);
    }

    // ============================================
    // 10. SEND EMAIL
    // ============================================
    let emailResult = { sent: false, method: 'none', error: null };

    if (sendEmail) {
      if (resend) {
        // Try Resend first
        try {
          await sendViaResend(resend, sanitizedEmail, sanitizedName, discipline.name, tempPassword);
          emailResult = { sent: true, method: 'resend', error: null };
        } catch (resendError) {
          console.error('Resend failed:', resendError.message);
          emailResult = { sent: false, method: 'resend', error: resendError.message };
        }
      } 

      // Fallback to Supabase's built-in email
      if (!emailResult.sent) {
        try {
          await supabaseAdmin.auth.admin.inviteUserByEmail(sanitizedEmail, {
            data: {
              full_name: sanitizedName,
              role: 'intern',
              discipline: discipline.name,
              temporary_password: tempPassword,
            },
            redirectTo: `${Deno.env.get('APP_URL') || 'http://localhost:5173'}/login`,
          });
          emailResult = { sent: true, method: 'supabase', error: null };
        } catch (supabaseEmailError) {
          console.error('Supabase email failed:', supabaseEmailError.message);
          emailResult = { sent: false, method: 'supabase', error: supabaseEmailError.message };
        }
      }
    }

    // ============================================
    // 11. LOG THE INVITATION
    // ============================================
    await supabaseAdmin.from('notifications').insert({
      user_id: authUser.user.id,
      type: 'account_created',
      title: 'Welcome to InternTrack!',
      message: `You've been enrolled in the ${discipline.name} program.${emailResult.sent ? ' Check your email for login details.' : ''}`,
      data: {
        discipline: discipline.name,
        temp_password: emailResult.sent ? null : tempPassword,
      },
      is_read: false,
    });

    // ============================================
    // 12. NOTIFY ALL ADMINS
    // ============================================
    const { data: admins, error: adminsError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .eq('role', 'admin');

    if (!adminsError && admins) {
      const adminNotifications = admins.map(admin => ({
        user_id: admin.id,
        type: 'intern_invited',
        title: 'New Intern Invited',
        message: `${sanitizedName} (${sanitizedEmail}) has been invited to ${discipline.name}.${!emailResult.sent ? ` Password: ${tempPassword}` : ''}`,
        data: {
          intern_id: authUser.user.id,
          intern_email: sanitizedEmail,
          intern_name: sanitizedName,
          discipline_id: disciplineId,
          discipline_name: discipline.name,
          email_sent: emailResult.sent,
          email_method: emailResult.method,
          temp_password: emailResult.sent ? null : tempPassword,
          invited_at: new Date().toISOString(),
        },
        is_read: false,
      }));

      await supabaseAdmin.from('notifications').insert(adminNotifications);
    }

    // ============================================
    // 13. RETURN SUCCESS RESPONSE
    // ============================================
    const executionTime = Date.now() - startTime;

    return createResponse({
      success: true,
      message: emailResult.sent 
        ? 'Invitation email sent successfully' 
        : 'Account created (email delivery unavailable)',
      requestId,
      executionTimeMs: executionTime,
      intern: {
        id: authUser.user.id,
        email: sanitizedEmail,
        fullName: sanitizedName,
        discipline: discipline.name,
      },
      email: {
        sent: emailResult.sent,
        method: emailResult.method,
      },
      // Only return password if email wasn't sent (so admin can share manually)
      tempPassword: emailResult.sent ? null : tempPassword,
    }, 201);

  } catch (error) {
    // ============================================
    // CATCH UNHANDLED ERRORS
    // ============================================
    console.error(`[${requestId}] Unhandled error:`, error);
    
    return createResponse({
      error: 'Internal server error',
      requestId,
      message: Deno.env.get('ENVIRONMENT') === 'development' ? error.message : 'Please try again later',
    }, 500);
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Validate email format
 */
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Check if email domain is allowed
 */
function isAllowedDomain(email) {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return ALLOWED_DOMAINS.some(
    allowed => domain === allowed || domain.endsWith('.' + allowed)
  );
}

/**
 * Validate UUID format
 */
function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Generate cryptographically secure password
 */
function generateSecurePassword(length = 16) {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghjkmnpqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*()-_=+';
  const allChars = uppercase + lowercase + numbers + symbols;

  // Ensure at least one of each character type
  const passwordArray = [
    uppercase[crypto.getRandomValues(new Uint32Array(1))[0] % uppercase.length],
    lowercase[crypto.getRandomValues(new Uint32Array(1))[0] % lowercase.length],
    numbers[crypto.getRandomValues(new Uint32Array(1))[0] % numbers.length],
    symbols[crypto.getRandomValues(new Uint32Array(1))[0] % symbols.length],
  ];

  // Fill remaining length with random characters
  const randomValues = crypto.getRandomValues(new Uint32Array(length - 4));
  for (let i = 0; i < length - 4; i++) {
    passwordArray.push(allChars[randomValues[i] % allChars.length]);
  }

  // Shuffle the array
  for (let i = passwordArray.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [passwordArray[i], passwordArray[j]] = [passwordArray[j], passwordArray[i]];
  }

  return passwordArray.join('');
}

/**
 * Send email via Resend
 */
async function sendViaResend(resend, email, fullName, discipline, tempPassword) {
  const appUrl = Deno.env.get('APP_URL') || 'http://localhost:5173';
  const appName = 'InternTrack';

  const { data, error } = await resend.emails.send({
    from: `${appName} <onboarding@resend.dev>`,
    to: [email],
    subject: `Welcome to ${appName} - ${discipline} Internship`,
    html: generateEmailTemplate(fullName, discipline, email, tempPassword, appUrl, appName),
  });

  if (error) {
    throw new Error(`Resend API error: ${error.message}`);
  }

  return data;
}

/**
 * Generate beautiful HTML email template
 */
function generateEmailTemplate(fullName, discipline, email, tempPassword, appUrl, appName) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f8f7f9; font-family: 'Inter', 'Segoe UI', Arial, sans-serif;">
  
  <!-- Outer Container -->
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f7f9; padding: 40px 20px;">
    <tr>
      <td align="center">
        
        <!-- Inner Card -->
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; border: 1px solid rgba(43,45,66,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="padding: 40px 40px 0 40px; text-align: center;">
              <div style="width: 48px; height: 48px; background-color: #0080c8; border-radius: 12px; display: inline-block; line-height: 48px; font-size: 24px; color: white; font-weight: bold;">
                IT
              </div>
              <h1 style="color: #2b2d42; font-size: 28px; font-weight: 700; margin: 20px 0 8px 0;">${appName}</h1>
              <p style="color: rgba(43,45,66,0.6); font-size: 14px; margin: 0;">Internship Management Platform</p>
            </td>
          </tr>
          
          <!-- Welcome Message -->
          <tr>
            <td style="padding: 32px 40px 0 40px;">
              <h2 style="color: #2b2d42; font-size: 22px; font-weight: 700; margin: 0 0 8px 0;">
                Welcome, ${escapeHtml(fullName)}! 🎉
              </h2>
              <p style="color: rgba(43,45,66,0.85); font-size: 15px; line-height: 24px; margin: 0;">
                You've been invited to join the <strong style="color: #2b2d42;">${escapeHtml(discipline)}</strong> internship program. We're excited to have you on board!
              </p>
            </td>
          </tr>
          
          <!-- Credentials Box -->
          <tr>
            <td style="padding: 24px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f7f9; border-radius: 12px; border: 1px solid rgba(43,45,66,0.06);">
                <tr>
                  <td style="padding: 24px;">
                    <p style="color: #2b2d42; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; margin: 0 0 16px 0;">
                      🔐 Your Login Credentials
                    </p>
                    
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 8px 0; color: rgba(43,45,66,0.5); font-size: 13px; width: 80px;">Email</td>
                        <td style="padding: 8px 0; color: #2b2d42; font-size: 14px; font-weight: 500; font-family: monospace;">${escapeHtml(email)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 8px 0; color: rgba(43,45,66,0.5); font-size: 13px;">Password</td>
                        <td style="padding: 8px 0; color: #2b2d42; font-size: 14px; font-weight: 500; font-family: monospace; letter-spacing: 0.5px;">${escapeHtml(tempPassword)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- CTA Button -->
          <tr>
            <td style="padding: 8px 40px 8px 40px; text-align: center;">
              <a href="${appUrl}/login" 
                 style="display: inline-block; background-color: #0080c8; color: #ffffff; text-decoration: none; 
                        padding: 14px 36px; border-radius: 10px; font-size: 16px; font-weight: 600;
                        transition: background-color 0.2s;">
                Sign In to Dashboard →
              </a>
            </td>
          </tr>
          
          <!-- Info -->
          <tr>
            <td style="padding: 24px 40px 8px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: rgba(146,220,229,0.15); border-radius: 8px; border-left: 3px solid #92dce5;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="color: #2b2d42; font-size: 13px; line-height: 20px; margin: 0;">
                      <strong>⚠️ Important:</strong> Please change your password after your first login for security purposes.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Divider -->
          <tr>
            <td style="padding: 24px 40px;">
              <hr style="border: none; border-top: 1px solid rgba(43,45,66,0.08); margin: 0;">
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 0 40px 32px 40px; text-align: center;">
              <p style="color: rgba(43,45,66,0.4); font-size: 12px; line-height: 18px; margin: 0;">
                This is an automated message from ${appName}.<br>
                If you believe this was sent in error, please contact your program administrator.
              </p>
            </td>
          </tr>
          
        </table>
        
        <!-- Bottom Note -->
        <p style="color: rgba(43,45,66,0.3); font-size: 11px; margin-top: 24px; text-align: center;">
          © ${new Date().getFullYear()} ${appName}. All rights reserved.
        </p>
        
      </td>
    </tr>
  </table>
  
</body>
</html>`;
}

/**
 * Escape HTML to prevent XSS in emails
 */
function escapeHtml(str) {
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
  };
  return String(str).replace(/[&<>"']/g, char => htmlEscapes[char] || char);
}

/**
 * Create consistent JSON response
 */
function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
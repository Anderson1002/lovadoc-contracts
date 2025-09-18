import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  name: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send confirmation email function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, confirmationUrl }: EmailRequest = await req.json();
    console.log('Sending confirmation email to:', email);

    // SMTP Configuration from Hostinger
    const smtpHost = Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com';
    const smtpPort = parseInt(Deno.env.get('SMTP_PORT') || '465');
    const smtpUser = Deno.env.get('SMTP_USER') || '';
    const smtpPassword = Deno.env.get('SMTP_PASSWORD') || '';

    console.log('SMTP Config:', { 
      hostname: smtpHost, 
      port: smtpPort, 
      username: smtpUser,
      passwordSet: !!smtpPassword 
    });

    if (!smtpUser || !smtpPassword) {
      throw new Error('SMTP credentials not configured');
    }

    // Create SMTP client
    const client = new SMTPClient({
      connection: {
        hostname: smtpHost,
        port: smtpPort,
        tls: true,
        auth: {
          username: smtpUser,
          password: smtpPassword,
        },
      },
    });

    // Email HTML content
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de registro</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
    <div style="background-color: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align: center; margin-bottom: 30px;">
            <div style="width: 64px; height: 64px; background-color: #007bff; border-radius: 16px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/>
                    <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/>
                    <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/>
                    <path d="M10 6h4"/>
                    <path d="M10 10h4"/>
                    <path d="M10 14h4"/>
                    <path d="M10 18h4"/>
                </svg>
            </div>
            <h1 style="color: #333; margin: 0; font-size: 28px; font-weight: bold;">Maktub</h1>
            <p style="color: #666; margin: 8px 0 0 0; font-size: 16px;">Gestión Digital de Contratos</p>
        </div>

        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">¡Confirma tu cuenta!</h2>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">Hola <strong>${name}</strong>,</p>
        
        <p style="color: #666; font-size: 16px; line-height: 1.5;">
            Gracias por registrarte en nuestro Sistema de Gestión Digital de Contratos. 
            Para completar tu registro y acceder a todas las funcionalidades, necesitas confirmar tu dirección de correo electrónico.
        </p>
        
        <div style="text-align: center; margin: 40px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #007bff; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px; transition: background-color 0.3s;">
                Confirmar mi cuenta
            </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 30px 0;">
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                <strong>¿No puedes hacer clic en el botón?</strong>
            </p>
            <p style="color: #666; font-size: 14px; margin: 0 0 10px 0;">
                Copia y pega este enlace en tu navegador:
            </p>
            <p style="color: #007bff; word-break: break-all; font-size: 14px; margin: 0; background-color: white; padding: 10px; border-radius: 4px; border: 1px solid #e9ecef;">
                ${confirmationUrl}
            </p>
        </div>
        
        <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
            <p style="color: #999; font-size: 14px; text-align: center; margin: 0;">
                <strong>Sistema de Gestión Digital de Contratos</strong><br>
                Versión 1.0 | Este correo fue enviado automáticamente
            </p>
            <p style="color: #999; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
                Si no te registraste en nuestro sistema, puedes ignorar este correo de forma segura.
            </p>
        </div>
    </div>
</body>
</html>`;

    // Send email
    await client.send({
      from: `Sistema Maktub <${smtpUser}>`,
      to: email,
      subject: "Confirmación de registro - Sistema Maktub",
      content: htmlContent,
      html: htmlContent,
    });

    await client.close();

    console.log('Email sent successfully to:', email);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Correo de confirmación enviado exitosamente' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        details: error.toString()
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailRequest {
  email: string;
  name: string;
  confirmationUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log('Send confirmation email function called');

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, confirmationUrl }: EmailRequest = await req.json();
    console.log('Sending confirmation email to:', email);

    // SMTP Configuration from Hostinger
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOST') || 'smtp.hostinger.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
      username: Deno.env.get('SMTP_USER') || '',
      password: Deno.env.get('SMTP_PASSWORD') || '',
    };

    console.log('SMTP Config:', { 
      hostname: smtpConfig.hostname, 
      port: smtpConfig.port, 
      username: smtpConfig.username,
      passwordSet: !!smtpConfig.password 
    });

    // Create SMTP connection
    const conn = await Deno.connect({
      hostname: smtpConfig.hostname,
      port: smtpConfig.port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to send SMTP command and read response
    const sendCommand = async (command: string): Promise<string> => {
      console.log('Sending SMTP command:', command.split(' ')[0]);
      await conn.write(encoder.encode(command + '\r\n'));
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      const response = decoder.decode(buffer.subarray(0, n || 0));
      console.log('SMTP response:', response.trim());
      return response;
    };

    try {
      // SMTP conversation
      await sendCommand('EHLO localhost');
      await sendCommand('AUTH LOGIN');
      
      // Encode credentials in base64
      const userB64 = btoa(smtpConfig.username);
      const passB64 = btoa(smtpConfig.password);
      
      await sendCommand(userB64);
      await sendCommand(passB64);
      
      await sendCommand(`MAIL FROM:<${smtpConfig.username}>`);
      await sendCommand(`RCPT TO:<${email}>`);
      await sendCommand('DATA');
      
      // Email content
      const emailContent = `Subject: Confirmación de registro - Sistema de Gestión Hospitalaria
From: Sistema <${smtpConfig.username}>
To: ${email}
Content-Type: text/html; charset=UTF-8

<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Confirmación de registro</title>
</head>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px;">
        <h1 style="color: #333; text-align: center;">¡Bienvenido al Sistema!</h1>
        <p style="color: #666; font-size: 16px;">Hola ${name},</p>
        <p style="color: #666; font-size: 16px;">
            Gracias por registrarte en nuestro Sistema de Gestión Hospitalaria. 
            Para completar tu registro, por favor confirma tu dirección de correo electrónico.
        </p>
        <div style="text-align: center; margin: 30px 0;">
            <a href="${confirmationUrl}" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Confirmar mi cuenta
            </a>
        </div>
        <p style="color: #999; font-size: 14px;">
            Si no puedes hacer clic en el botón, copia y pega este enlace en tu navegador:
        </p>
        <p style="color: #007bff; word-break: break-all; font-size: 14px;">
            ${confirmationUrl}
        </p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="color: #999; font-size: 12px; text-align: center;">
            Sistema de Gestión Hospitalaria v1.0<br>
            Este correo fue enviado automáticamente, por favor no responder.
        </p>
    </div>
</body>
</html>

.`;

      await sendCommand(emailContent);
      await sendCommand('.');
      await sendCommand('QUIT');
      
      console.log('Email sent successfully to:', email);
      
    } finally {
      conn.close();
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Correo de confirmación enviado exitosamente' 
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );

  } catch (error: any) {
    console.error('Error sending confirmation email:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
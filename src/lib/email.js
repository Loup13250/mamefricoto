import nodemailer from 'nodemailer';
import { getDb } from '@/lib/db';

/**
 * Envoie un email de notification lorsqu'un message est soumis dans le formulaire de contact,
 * directement à l'adresse de Mamé Fricoto (mamefricoto@gmail.com).
 * Contient l'intégralité des informations saisies par le client.
 */
export async function sendContactNotification(data) {
    let siteInfo = {};
    try {
        const db = getDb();
        const rows = await db.prepare('SELECT key, value FROM site_info').all();
        siteInfo = Object.fromEntries(rows.map(r => [r.key, r.value]));
    } catch (e) {
        console.warn('[Email] Impossible de lire site_info, utilisation des valeurs par défaut:', e.message);
    }

    const recipient = siteInfo.notification_email || process.env.NOTIFY_EMAIL || 'mamefricoto@gmail.com';
    const formspreeUrl = siteInfo.formspree_url || process.env.FORMSPREE_URL;
    const smtpPass = siteInfo.smtp_pass || process.env.SMTP_PASS;
    const resendApiKey = siteInfo.resend_api_key || process.env.RESEND_API_KEY;

    const {
        name = 'Client',
        email = '',
        phone = '',
        event_type = 'Demande de prestation',
        guests = '',
        event_date = '',
        message = ''
    } = data;

    const subject = `🍽️ Nouvelle demande traiteur de ${name} (${event_type || 'Devis'})`;

    const htmlContent = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e8dfd5; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
    <div style="background: #9e472a; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.05em;">Mamé Fricoto</h1>
        <p style="margin: 6px 0 0; font-size: 14px; opacity: 0.95;">Nouvelle demande de contact / devis</p>
    </div>
    
    <div style="padding: 24px 28px; color: #2d2926; background: #fffcf9;">
        <p style="font-size: 16px; margin-top: 0; color: #1f1d1b;">Bonjour Léa,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #555;">Une personne vient de remplir le formulaire de contact sur le site <strong>mamefricoto.fr</strong> :</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; background: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #ebd8c5;">
            <tr style="background: #fbf5ef;">
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16; border-bottom: 1px solid #ebd8c5; width: 35%;">Nom complet</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #ebd8c5; color: #1f1d1b; font-weight: 700;">${escapeHtml(name)}</td>
            </tr>
            <tr>
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16; border-bottom: 1px solid #ebd8c5;">Email</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #ebd8c5;"><a href="mailto:${escapeHtml(email)}" style="color: #9e472a; text-decoration: underline; font-weight: 600;">${escapeHtml(email)}</a></td>
            </tr>
            <tr style="background: #fbf5ef;">
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16; border-bottom: 1px solid #ebd8c5;">Téléphone</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #ebd8c5;"><a href="tel:${escapeHtml(phone)}" style="color: #1f1d1b; text-decoration: none; font-weight: 600;">${escapeHtml(phone || 'Non renseigné')}</a></td>
            </tr>
            <tr>
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16; border-bottom: 1px solid #ebd8c5;">Prestation</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #ebd8c5;"><span style="background: #e8dcc4; color: #723b16; padding: 3px 8px; border-radius: 4px; font-weight: bold; font-size: 13px;">${escapeHtml(event_type || 'Demande générale')}</span></td>
            </tr>
            <tr style="background: #fbf5ef;">
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16; border-bottom: 1px solid #ebd8c5;">Nombre d'invités</td>
                <td style="padding: 12px 14px; border-bottom: 1px solid #ebd8c5; color: #1f1d1b;">${escapeHtml(guests ? `${guests} personnes` : 'Non précisé')}</td>
            </tr>
            <tr>
                <td style="padding: 12px 14px; font-weight: 600; color: #723b16;">Date souhaitée</td>
                <td style="padding: 12px 14px; color: #1f1d1b; font-weight: 700;">${escapeHtml(event_date || 'Non précisée')}</td>
            </tr>
        </table>
        
        <div style="background: #ffffff; border: 1px solid #ebd8c5; border-left: 4px solid #9e472a; padding: 16px; border-radius: 6px; margin: 20px 0;">
            <div style="font-weight: 700; margin-bottom: 8px; color: #9e472a; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Message du client :</div>
            <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.6; color: #2d2926;">${escapeHtml(message)}</div>
        </div>
        
        <div style="text-align: center; margin: 28px 0 10px;">
            <a href="mailto:${escapeHtml(email)}?subject=Re:%20Votre%20demande%20chez%20Mamé%20Fricoto" style="background: #9e472a; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; margin-right: 8px;">✉️ Répondre au client</a>
            <a href="https://mamefricoto.vercel.app/admin/dashboard/messages" style="background: #f1e4d3; color: #723b16; text-decoration: none; padding: 12px 18px; border-radius: 6px; font-weight: 600; font-size: 14px; display: inline-block; border: 1px solid #e2cbaf;">📋 Voir l'admin</a>
        </div>
    </div>
    
    <div style="background: #f4ece2; padding: 14px; text-align: center; font-size: 12px; color: #8c735d;">
        Notification automatique envoyée à <strong>${escapeHtml(recipient)}</strong> depuis <strong>mamefricoto.vercel.app</strong>
    </div>
</div>
`;

    const textContent = `
NOUVELLE DEMANDE TRAITEUR - MAMÉ FRICOTO
---------------------------------------------
Client : ${name}
Email : ${email}
Téléphone : ${phone || 'Non renseigné'}
Type de prestation : ${event_type || 'Demande générale'}
Nombre d'invités : ${guests || 'Non précisé'}
Date souhaitée : ${event_date || 'Non précisée'}

Message :
${message}

---------------------------------------------
Répondre au client : ${email}
Espace admin : https://mamefricoto.vercel.app/admin/dashboard/messages
`;

    // 1. Tenter via Nodemailer (SMTP Gmail) si configuré
    if (smtpPass && smtpPass !== 'xxxx xxxx xxxx xxxx' && smtpPass.trim().length >= 8) {
        try {
            const transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: parseInt(process.env.SMTP_PORT || '465', 10),
                secure: process.env.SMTP_SECURE === 'true' || (process.env.SMTP_PORT ? process.env.SMTP_PORT === '465' : true),
                auth: {
                    user: process.env.SMTP_USER || 'mamefricoto@gmail.com',
                    pass: smtpPass.replace(/\s+/g, ''),
                },
            });

            await transporter.sendMail({
                from: `"Mamé Fricoto" <${process.env.SMTP_USER || 'mamefricoto@gmail.com'}>`,
                to: recipient,
                replyTo: email,
                subject: subject,
                text: textContent,
                html: htmlContent,
            });

            console.log(`[Email] Notification envoyée avec succès via SMTP à ${recipient}`);
            return { success: true, method: 'smtp' };
        } catch (smtpErr) {
            console.error('[Email] Échec SMTP :', smtpErr.message);
        }
    }

    // 2. Tenter via Resend API si clé fournie
    if (resendApiKey) {
        try {
            const res = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${resendApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    from: 'Mamé Fricoto <onboarding@resend.dev>',
                    to: [recipient],
                    reply_to: email,
                    subject: subject,
                    text: textContent,
                    html: htmlContent,
                }),
            });

            if (res.ok) {
                console.log(`[Email] Notification envoyée via Resend à ${recipient}`);
                return { success: true, method: 'resend' };
            }
        } catch (resendErr) {
            console.error('[Email] Échec Resend :', resendErr.message);
        }
    }

    // 3. Tenter via Formspree si URL fournie
    if (formspreeUrl && formspreeUrl.startsWith('http')) {
        try {
            // Formatage convivial de la date en français (ex: Vendredi 2 octobre 2026)
            let dateAffichee = event_date || 'Non précisée';
            if (event_date && /^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
                try {
                    const [y, m, d] = event_date.split('-');
                    const dateObj = new Date(parseInt(y, 10), parseInt(m, 10) - 1, parseInt(d, 10));
                    const formatter = new Intl.DateTimeFormat('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                    });
                    const formatted = formatter.format(dateObj);
                    dateAffichee = formatted.charAt(0).toUpperCase() + formatted.slice(1) + ` (${d}/${m}/${y})`;
                } catch {
                    const [y, m, d] = event_date.split('-');
                    dateAffichee = `${d}/${m}/${y}`;
                }
            }

            const res = await fetch(formspreeUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify({
                    _subject: subject,
                    _replyto: email,
                    "Nom du client": name,
                    "Email": email,
                    "Téléphone": phone || 'Non renseigné',
                    "Prestation souhaitée": event_type || 'Demande générale',
                    "Nombre de personnes": guests ? `${guests} personnes` : 'Non précisé',
                    "Date de l'événement": dateAffichee,
                    "Message": message,
                }),
            });

            if (res.ok) {
                console.log(`[Email] Notification envoyée via Formspree en français`);
                return { success: true, method: 'formspree' };
            }
        } catch (formspreeErr) {
            console.error('[Email] Échec Formspree :', formspreeErr.message);
        }
    }

    console.warn(`[Email] Message sauvegardé en BDD mais aucun service d'envoi d'email configuré. Notification préparée pour ${recipient}.`);
    return { success: false, reason: 'unconfigured' };
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

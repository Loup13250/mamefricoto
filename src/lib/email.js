/**
 * Envoie une notification via Formspree (ou un autre webhook) lorsqu'un formulaire de contact est soumis.
 * Ne lève pas d'erreur si l'envoi échoue (log uniquement) — le message est déjà sauvegardé en BDD.
 */
export async function sendContactNotification(formspreeUrl, data) {
    if (!formspreeUrl) {
        console.warn('[Formspree] URL non configurée — notification non envoyée.');
        return;
    }

    try {
        const response = await fetch(formspreeUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Erreur HTTP: ${response.status}`);
        }

        console.log(`[Formspree] Notification envoyée avec succès pour la demande de ${data.name}`);
    } catch (err) {
        console.error('[Formspree] Erreur lors de l\'envoi de la notification :', err.message);
        // On ne relance pas l'erreur — le message est déjà sauvegardé en BDD
    }
}

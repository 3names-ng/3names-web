// translations/fr.ts
// Français

import type { TranslationKey } from "./en";

const fr: Partial<Record<TranslationKey, string>> = {
  // ── Navigation / Tabs ────────────────────────────────────────
  "tab.home": "Accueil",
  "tab.explore": "Explorer",
  "tab.messages": "Messages",
  "tab.following": "Abonnements",
  "tab.materials": "Ressources",
  "tab.profile": "Profil",

  // ── Common Actions ───────────────────────────────────────────
  "action.back": "Retour",
  "action.done": "Terminé",
  "action.cancel": "Annuler",
  "action.save": "Enregistrer",
  "action.delete": "Supprimer",
  "action.edit": "Modifier",
  "action.send": "Envoyer",
  "action.confirm": "Confirmer",
  "action.yes": "Oui",
  "action.no": "Non",
  "action.close": "Fermer",
  "action.retry": "Réessayer",
  "action.submit": "Soumettre",
  "action.next": "Suivant",
  "action.previous": "Précédent",
  "action.apply": "Appliquer",
  "action.search": "Rechercher",
  "action.loading": "Chargement...",
  "action.refresh": "Actualiser",
  "action.share": "Partager",
  "action.copy": "Copier",
  "action.viewAll": "Voir tout",
  "action.seeMore": "Voir plus",
  "action.seeLess": "Voir moins",
  "action.learnMore": "En savoir plus",
  "action.submitting": "Soumission...",
  "action.deactivate": "Désactiver",

  // ── Auth ─────────────────────────────────────────────────────
  "auth.login": "Se connecter",
  "auth.signup": "S'inscrire",
  "auth.logout": "Se déconnecter",
  "auth.forgotPassword": "Mot de passe oublié ?",
  "auth.resetPassword": "Réinitialiser le mot de passe",
  "auth.enterEmail": "Entrez votre adresse e-mail",
  "auth.enterPassword": "Entrez votre mot de passe",
  "auth.confirmPassword": "Confirmez votre mot de passe",
  "auth.email": "E-mail",
  "auth.password": "Mot de passe",
  "auth.fullName": "Nom complet",
  "auth.username": "Nom d'utilisateur",
  "auth.phone": "Numéro de téléphone",
  "auth.noAccount": "Vous n'avez pas de compte ?",
  "auth.hasAccount": "Vous avez déjà un compte ?",
  "auth.continueWithGoogle": "Continuer avec Google",

  // ── Profile ──────────────────────────────────────────────────
  "profile.title": "Profil",
  "profile.editProfile": "Modifier le profil",
  "profile.followers": "Abonnés",
  "profile.following": "Abonnements",
  "profile.posts": "Publications",
  "profile.follow": "Suivre",
  "profile.unfollow": "Ne plus suivre",
  "profile.followingYou": "Vous suit",
  "profile.block": "Bloquer",
  "profile.unblock": "Débloquer",
  "profile.report": "Signaler",
  "profile.message": "Message",
  "profile.shareProfile": "Partager le profil",
  "profile.manageAccount": "Gérez tout ce qui concerne votre compte",
  "profile.account": "COMPTE",
  "profile.activity": "ACTIVITÉ",
  "profile.studentVerification": "Vérification étudiant",
  "profile.verifyIdentity": "Vérifiez votre identité scolaire",
  "profile.achievements": "Succès",
  "profile.likes": "J'aime",
  "profile.gifts": "Cadeaux",
  "profile.anonymousStudent": "Étudiant anonyme",
  "profile.tabPosts": "Publications",
  "profile.tabReshares": "Partages",
  "profile.tabDrafts": "Brouillons",
  "profile.tabHidden": "Masqués",
  "profile.tabSaved": "Enregistrés",
  "profile.tabTagged": "Tagués",
  "profile.noContent": "Aucun contenu",
  "profile.emptyTab": "Aucun {{tab}} trouvé",

  // ── Settings ─────────────────────────────────────────────────
  "settings.title": "Paramètres",
  "settings.notifications": "Notifications",
  "settings.privacySecurity": "Confidentialité et sécurité",
  "settings.language": "Langue",
  "settings.appearance": "Apparence",
  "settings.dark": "Sombre",
  "settings.light": "Clair",
  "settings.storageCache": "Stockage et cache",
  "settings.helpSupport": "Aide et support",
  "settings.reportProblem": "Signaler un problème",
  "settings.blockedUsers": "Utilisateurs bloqués",
  "settings.accountAction": "Compte",
  "settings.deactivateAccount": "Désactiver le compte",
  "settings.deleteAccount": "Supprimer le compte",
  "settings.onlineStatus": "Statut en ligne",
  "settings.readReceipts": "Accusés de lecture",
  "settings.activityStatus": "Statut d'activité",
  "settings.marketplace": "Marketplace",
  "settings.hostel": "Foyer",
  "settings.leaderboard": "Classement & Niveaux",
  "settings.general": "Général",
  "settings.soundEnabled": "Son",
  "settings.waveform": "Forme d'onde des messages vocaux",
  "settings.waveformDesc": "Personnaliser l'apparence des messages vocaux",
  "settings.manageCachedData": "Gérer les données en cache",

  // ── Language ─────────────────────────────────────────────────
  "language.title": "Langue",
  "language.select": "SÉLECTIONNEZ VOTRE LANGUE",
  "language.updated": "Langue mise à jour",
  "language.setTo": "Langue définie sur {{language}}",
  "language.footer": "La langue de l'application sera mise à jour sur tous les écrains. Certains contenus d'autres utilisateurs peuvent rester dans leur langue d'origine.",

  // ── Messages / Chat ──────────────────────────────────────────
  "chat.title": "Messages",
  "chat.subtitle": "Restez connecté avec les champions",
  "chat.searchPlaceholder": "Rechercher des messages...",
  "chat.noMessages": "Pas encore de messages",
  "chat.startConversation": "Commencer une conversation",
  "chat.typeMessage": "Tapez un message...",
  "chat.updateMessage": "Mettre à jour le message...",
  "chat.loading": "Ouverture du chat...",
  "chat.send": "Envoyer",
  "chat.online": "En ligne",
  "chat.offline": "Hors ligne",
  "chat.typing": "écrit...",
  "chat.leftTheChat": "{{name}} a quitté le chat",
  "chat.joinedTheChat": "{{name}} a rejoint le chat",
  "chat.sentGift": "{{name}} a envoyé {{gift}} x{{count}}",
  "chat.pinnedMessage": "Message épinglé",
  "chat.unpinMessage": "Désépingler",
  "chat.replyTo": "Répondre à {{name}}",
  "chat.jumpToMessage": "Aller au message",
  "chat.messageNotInView": "Message non visible",
  "chat.messageNotLoaded": "Le message original n'est pas chargé dans ce chat.",
  "chat.deleteMessage": "Supprimer le message",
  "chat.editMessage": "Modifier le message",
  "chat.copyMessage": "Copier",
  "chat.replyMessage": "Répondre",
  "chat.pinMessage": "Épingler le message",
  "chat.deleteConfirmTitle": "Supprimer ce message ?",
  "chat.deleteConfirmBody": "Cette action est irréversible.",
  "chat.messageUpdated": "Message mis à jour",
  "chat.messageDeleted": "Message supprimé",
  "chat.couldNotDeleteMessage": "Impossible de supprimer le message",
  "chat.couldNotSendVoiceNote": "Impossible d'envoyer le message vocal",
  "chat.couldNotStartRecording": "Impossible de démarrer l'enregistrement",
  "chat.couldNotStopRecording": "Impossible d'arrêter l'enregistrement",
  "chat.permissionMediaRequired": "L'accès à la bibliothèque multimédia est requis.",
  "chat.permissionMicRequired": "L'accès au microphone est requis pour enregistrer des messages vocaux.",
  "chat.connectionFailed": "Échec de la connexion",
  "chat.showingSavedMessages": "Hors ligne — affichage de vos messages enregistrés.",
  "chat.chatError": "Erreur de chat",
  "chat.couldNotStart": "Impossible de démarrer la conversation.",
  "chat.couldNotSendGift": "Impossible d'envoyer le cadeau",
  "chat.notificationsMuted": "Notifications coupées",
  "chat.notificationsUnmuted": "Notifications réactivées",
  "chat.chatBubbleUpdated": "Bulle de chat mise à jour",
  "chat.couldNotSyncBubble": "Impossible de synchroniser le style de bulle",
  "chat.actionFailed": "Échec de l'action",
  "chat.deleteChat": "Supprimer le chat",
  "chat.deleteChatConfirm": "Supprimer ce chat ?",
  "chat.deleteChatBody": "Tous les messages seront définitivement supprimés.",
  "chat.chatDeleted": "Chat supprimé",
  "chat.couldNotDeleteChat": "Impossible de supprimer le chat",
  "chat.customizeBubble": "Personnaliser la bulle",
  "chat.chatBackground": "Arrière-plan du chat",
  "chat.sharedMedia": "Médias partagés",
  "chat.viewProfile": "Voir le profil",
  "chat.mute": "Couper",
  "chat.unmute": "Activer",
  "chat.pinChat": "Épingler le chat",
  "chat.unpinChat": "Désépingler le chat",
  "chat.searchMembers": "Rechercher des membres...",
  "chat.left": "a quitté",
  "chat.joined": "a rejoint",
  "chat.pinned": "a épinglé",
  "chat.unpinned": "a désépinglé",
  "chat.addReaction": "Ajouter une réaction",
  "chat.reply": "Répondre",
  "chat.replyToMessage": "Répondre à {{name}}",
  "chat.cancelReply": "Annuler la réponse",
  "chat.gallery": "Galerie",
  "chat.document": "Document",
  "chat.recordVoice": "Enregistrer un vocal",
  "chat.stopRecording": "Arrêter l'enregistrement",
  "chat.cancelRecording": "Annuler",
  "chat.sendVoice": "Envoyer",
  "chat.listenVoice": "Écouter",
  "chat.deleteVoice": "Supprimer",
  "chat.messagePlaceholder": "Message",
  "chat.updatePlaceholder": "Mettre à jour le message...",
  "chat.typePlaceholder": "Tapez un message...",
  "group.searchMembers": "Rechercher des membres...",
  "group.searchDefault": "Rechercher groupes par défaut...",
  "group.searchMy": "Rechercher mes groupes...",

  // ── Posts / Feed ─────────────────────────────────────────────
  "post.like": "J'aime",
  "post.unlike": "Je n'aime plus",
  "post.comment": "Commenter",
  "post.comments": "Commentaires",
  "post.share": "Partager",
  "post.delete": "Supprimer la publication",
  "post.edit": "Modifier la publication",
  "post.report": "Signaler la publication",
  "post.noPosts": "Pas encore de publications",
  "post.writeSomething": "Écrivez quelque chose...",
  "post.likedBy": "Aimé par {{name}}",
  "post.commentsCount": "{{count}} commentaires",
  "post.loadingFeed": "Chargement de votre fil…",
  "post.noPostsInTab": "Pas de publications dans {{tab}}",
  "post.beTheFirst": "Soyez le premier à créer une publication ou revenez plus tard.",
  "post.refreshFeed": "Actualiser le fil",
  "post.sharedToFeed": "Publication partagée sur votre fil",
  "post.couldNotShare": "Impossible de partager cette publication.",
  "post.reportedSuccess": "Publication signalée avec succès",
  "post.couldNotReport": "Impossible de signaler cette publication.",
  "post.deletedSuccess": "Publication supprimée avec succès",
  "post.commentsTitle": "Commentaires",
  "post.noComments": "Pas encore de commentaires. Soyez le premier !",
  "post.addComment": "Ajouter un commentaire...",

  // ── Groups ───────────────────────────────────────────────────
  "group.title": "Groupes",
  "group.create": "Créer un groupe",
  "group.join": "Rejoindre le groupe",
  "group.leave": "Quitter le groupe",
  "group.members": "Membres",
  "group.member": "Membre",
  "group.name": "Nom du groupe",
  "group.description": "Description",
  "group.noGroups": "Pas encore de groupes",
  "group.searchPlaceholder": "Rechercher des groupes...",
  "group.online": "{{count}} en ligne",

  // ── Notifications ────────────────────────────────────────────
  "notifications.title": "Notifications",
  "notifications.noNotifications": "Pas encore de notifications",
  "notifications.markAllRead": "Tout marquer comme lu",
  "notifications.settings": "Paramètres de notification",

  // ── Explore ──────────────────────────────────────────────────
  "explore.title": "Explorer",
  "explore.searchPlaceholder": "Rechercher sur le campus...",
  "explore.trending": "Tendances",
  "explore.latest": "Dernières",
  "explore.forYou": "Pour vous",
  "explore.searchTagUser": "Rechercher un utilisateur à taguer",
  "explore.searchTagMode": "Rechercher {{mode}} à taguer",

    "explore.tagPeople": "Taguer des personnes",

    "explore.followers": "Abonnés",

    "explore.following": "Abonnements",

    "explore.selected": "{{count}} sélectionné(s)",

    "explore.typeToSearch": "Tapez pour rechercher un utilisateur.",

    "explore.noUsersToTag": "Aucun {{mode}} disponible à taguer.",

    "explore.postPreview": "Aperçu du post",

    "explore.feedPreview": "Aperçu du fil",

    "explore.privacyDistribution": "Confidentialité & Distribution",

    "explore.whoCanSee": "Qui peut voir ce post",

    "explore.whoCanComment": "Qui peut commenter",

    "explore.categoryLabel": "Catégorie",

    "explore.categoryNone": "Aucune",
    "explore.public": "Public",
    "explore.friends": "Amis",
    "explore.schoolOnly": "École uniquement",
    "explore.everyone": "Tout le monde",
    "explore.nobody": "Personne",

    "explore.giftsTipping": "Cadeaux & Pourboires",

    "explore.allowed": "Autorisé",

    "explore.disabled": "Désactivé",

    "explore.editPost": "Modifier le post",

    "explore.publishNow": "Publier maintenant",

    "explore.saveDraft": "Brouillon",

    "explore.draftSaved": "Enregistré dans vos brouillons",

    "explore.draftSaveFailed": "Impossible d'enregistrer le brouillon. Réessayez.",

    "profile.localDraft": "Sur l'appareil",

    "profile.deleteDraft": "Supprimer le brouillon",

    "profile.deleteDraftConfirm": "Ce brouillon sera supprimé de cet appareil.",

    "explore.publishing": "Publication en cours...",

    "explore.hdrActive": "HDR ACTIF",

    "explore.recordingPaused": "PAUSÉ",

    "explore.recording": "REC",

    "explore.permissionCameraTitle": "Permission requise",

    "explore.permissionCameraMsg": "L'accès à la caméra est nécessaire pour capturer des photos et des vidéos.",

    "explore.permissionMicTitle": "Permission requise",

    "explore.permissionMicMsg": "L'accès au microphone est nécessaire pour capturer des vidéos avec son.",

    "explore.permissionGalleryTitle": "Permission requise",

    "explore.permissionGalleryMsg": "L'accès à votre galerie photos est requis !",

    "explore.missingContentTitle": "Contenu manquant",

    "explore.missingContentMsg": "Veuillez ajouter une légende et au moins une photo ou vidéo.",

    "explore.missingCaptionTitle": "Légende manquante",

    "explore.missingCaptionMsg": "Veuillez écrire une légende pour votre post.",

    "explore.missingMediaTitle": "Média manquant",

    "explore.missingMediaMsg": "Veuillez ajouter au moins une photo ou vidéo.",

    "explore.publishSuccessTitle": "Succès",

    "explore.publishSuccessMsg": "Votre post a été publié !",

    "explore.publishErrorTitle": "Erreur de publication",

    "explore.publishErrorMsg": "Impossible d'enregistrer le post",

    "explore.publishFailedDraftKept": "Votre post n'a pas pu être publié. Il est enregistré — ouvrez Créer pour réessayer.",

    "post.captionPlaceholder": "Que se passe-t-il ?",

    "post.addHashtag": "Ajouter un hashtag...",

    "post.selectCategory": "Sélectionner une catégorie",

    "post.chooseAudience": "Choisir le public",

    "post.whoCanComment": "Qui peut commenter ?",

    "post.audienceLabel": "Public",

    "post.whoCanCommentLabel": "Qui peut commenter",

    "post.public": "Public",

    "post.followers": "Abonnés",

    "post.schoolOnly": "École uniquement",

    "post.everyone": "Tout le monde",

    "post.nobody": "Personne",

    "post.preview": "Aperçu",

    "post.campusLife": "Vie de campus",

    "post.academics": "Études",

    "post.sports": "Sports",

    "post.hostel": "Foyer",

    "post.marketplace": "Marché",

    "post.events": "Événements",

    "post.food": "Nourriture",

    "post.entertainment": "Divertissement",

    "post.general": "Général",

    "post.commentsLocked": "Les commentaires sont désactivés",

    "post.commentsLockedDesc": "L'auteur a limité qui peut voir et laisser des commentaires sur ce post.",

    "post.reply": "Répondre",

    "post.hideReplies": "Masquer les réponses",

    "post.viewReplies": "Voir {{count}} réponses",

    "post.commentOptions": "Options de commentaire",

    "post.deleteComment": "Supprimer le commentaire",

    "post.reportComment": "Signaler le commentaire",

    "post.reportReasonTitle": "Signaler le commentaire",

    "post.reportReasonMsg": "Veuillez sélectionner une raison pour signaler ce commentaire :",

    "post.selectReason": "Sélectionnez une raison :",

    "post.cancel": "Annuler",

    "post.commentDeleted": "Commentaire supprimé avec succès.",

    "post.couldNotDeleteComment": "Impossible de supprimer le commentaire. Veuillez réessayer.",

    "post.thankYouReport": "Merci d'avoir signalé ce commentaire.",

    "post.couldNotReportComment": "Impossible de soumettre le signalement. Veuillez réessayer.",

    "post.couldNotPostComment": "Impossible de poster le commentaire. Veuillez réessayer.",

    "post.spamScam": "Spam ou Arnaque",

    "post.harassment": "Harcèlement ou Discours de haine",

    "post.inappropriate": "Contenu inapproprié",

    "post.other": "Autre",

    "hostel.coverBadge": "Couverture",

    "hostel.addPhoto": "Ajouter une photo",

    "hostel.photoLimitTitle": "Limite atteinte",

    "hostel.photoLimitMsg": "Vous ne pouvez télécharger que 10 photos maximum.",

    "hostel.photoPermTitle": "Permission requise",

    "hostel.photoPermMsg": "Vous devez accorder les permissions de la bibliothèque photo pour sélectionner des images.",

    "hostel.hostelNameLabel": "Nom du foyer",

    "hostel.hostelNamePlaceholder": "Sunshine Lodge",

    "hostel.descLabel": "Description",

    "hostel.descPlaceholder": "Racontez aux étudiants votre foyer...",

    "hostel.validationError": "Erreur de validation",

    "hostel.photoRequired": "Veuillez télécharger au moins une photo.",

    "hostel.nameRequired": "Le nom du foyer est requis.",

    "hostel.descRequired": "La description est requise.",

    "hostel.fillRequired": "Veuillez remplir tous les champs requis.",

    "hostel.next": "Suivant",

    "hostel.roomTypeLabel": "Type de chambre",

    "hostel.genderLabel": "Genre",

    "hostel.male": "Homme",

    "hostel.female": "Femme",

    "hostel.mixed": "Mixte",

    "hostel.maxOccupants": "Capacité max.",

    "hostel.totalRooms": "Total des chambres",

    "hostel.availableRoomsLabel": "Chambres disponibles",

    "hostel.availabilityLabel": "Disponibilité",

    "hostel.availableNow": "Disponible maintenant",

    "hostel.nextMonth": "Le mois prochain",

    "hostel.comingSoon": "Bientôt disponible",

    "hostel.lookingRoommate": "Vous cherchez un colocataire ?",

    "hostel.seekingRoommate": "Votre annonce indiquera que vous cherchez un colocataire",

    "hostel.selfOnly": "Vous louez cet espace uniquement pour vous",

    "hostel.wifi": "Wi-Fi",

    "hostel.electricity247": "Électricité 24/7",

    "hostel.runningWater": "Eau courante",

    "hostel.security": "Sécurité",

    "hostel.cctv": "CCTV",

    "hostel.parking": "Parking",

    "hostel.laundry": "Blanchisserie",

    "hostel.kitchen": "Cuisine",

    "hostel.wardrobe": "Garde-robe",

    "hostel.studyArea": "Espace d'étude",

    "hostel.generator": "Groupe électrogène",

    "hostel.fullyFurnished": "Entièrement meublé",

    "hostel.airConditioner": "Climatiseur",

    "hostel.balcony": "Balcon",

    "hostel.smartTv": "TV intelligente",

    "hostel.contactPersonLabel": "Personne de contact",

    "hostel.contactPersonPlaceholder": "Jean Dupont",

    "hostel.phoneLabel": "Numéro de téléphone",

    "hostel.phonePlaceholder": "+234 801 234 5678",

    "hostel.whatsappLabel": "Numéro WhatsApp",

    "hostel.emailLabel": "Adresse email",

    "hostel.emailPlaceholder": "hostel@email.com",

    "hostel.officeAddressLabel": "Adresse du bureau (Optionnel)",

    "hostel.officeAddressPlaceholder": "12 Ugbowo Road",

    "hostel.contactHoursLabel": "Heures de contact",

    "hostel.contactHoursPlaceholder": "8h00 - 18h00",

    "hostel.preferredContact": "Méthode de contact préférée",

    "hostel.previewLocation": "Emplacement",

    "hostel.previewNear": "Près de {{school}}",

    "hostel.previewMonthlyRent": "Loyer mensuel",

    "hostel.previewServiceCharge": "Frais de service:",

    "hostel.previewCautionFee": "Caution:",

    "hostel.previewTotal": "Total:",

    "hostel.previewRoomDetails": "Détails de la chambre",

    "hostel.previewRoomType": "Type: {{type}}",

    "hostel.previewGender": "Genre: {{gender}}",

    "hostel.previewCapacity": "Capacité: {{count}} personne(s)",

    "hostel.previewAvailableRooms": "Chambres dispo: {{count}}",

    "hostel.previewAmenities": "Équipements",

    "hostel.previewRules": "Règles",

    "hostel.previewCurfew": "Couvre-feu: {{value}}",

    "hostel.previewVisitors": "Visiteurs: {{value}}",

    "hostel.previewPets": "Animaux: {{value}}",

    "hostel.previewSmoking": "Tabac: {{value}}",

    "hostel.allowed": "Autorisé",

    "hostel.notAllowed": "Non autorisé",

    "hostel.none": "Aucun",

    "hostel.publishHostel": "Publier le foyer",

    "hostel.publishing": "Publication...",

    "hostel.publishSuccess": "Votre annonce de foyer a été envoyée à un administrateur pour approbation et apparaîtra une fois approuvée.",

    "hostel.publishError": "Une erreur s'est produite.",

    "hostel.publishSuccessTitle": "Soumis pour examen",

    "hostel.publishErrorTitle": "Erreur",

    "feedCard.more": "Plus",

    "feedCard.less": "Moins",

    "feedCard.editCaption": "Modifier la légende",

    "feedCard.editHashtags": "Modifier les hashtags",

    "feedCard.changeCategory": "Changer la catégorie",

    "feedCard.changePermission": "Modifier les permissions",

    "feedCard.giftSettings": "Paramètres des cadeaux",

    "feedCard.playbackSpeed": "Vitesse de lecture",

    "feedCard.playbackSpeedTitle": "Vitesse de lecture",

    "feedCard.playbackSpeedHint": "Choisissez la vitesse de lecture de cette vidéo.",

    "feedCard.hideFromFeed": "Masquer du fil",

    "feedCard.reportPost": "Signaler le post",

    "feedCard.deletePermanently": "Supprimer définitivement",

    "feedCard.editCaptionTitle": "Modifier la légende",

    "feedCard.writeContext": "Écrivez le contexte ici...",

    "feedCard.back": "Retour",

    "feedCard.save": "Enregistrer",

    "feedCard.editHashtagsTitle": "Modifier les hashtags",

    "feedCard.hashtagHint": "Séparez les tags par des espaces. Pas besoin de taper '#'.",

    "feedCard.editCategoryTitle": "Modifier la catégorie",

    "feedCard.editCategoryHint": "Aidez vos pairs à découvrir votre post par sujet.",

    "feedCard.adjustPrivacy": "Ajuster la confidentialité et les permissions",

    "feedCard.giftSettingsTitle": "Paramètres des cadeaux",

    "feedCard.giftSettingsHint": "Gérez les paramètres de monétisation pour ce contenu.",

    "feedCard.receiveAwards": "Recevoir des récompenses et cadeaux",

    "feedCard.receiveAwardsHint": "Autoriser les jetons numériques et les cadeaux sur ce post",

    "feedCard.savePreference": "Enregistrer les préférences",

    "feedCard.reportTitle": "Signaler le post",

    "feedCard.reportHint": "Veuillez nous indiquer la raison de votre signalement. Votre signalement est anonyme.",

    "feedCard.reportReasonPlaceholder": "Tapez votre raison ici...",

    "feedCard.submitReport": "Soumettre le signalement",

    "feedCard.hideConfirmTitle": "Masquer ce post ?",

    "feedCard.hideConfirmMsg": "Vous ne verrez plus ce post dans votre fil d'actualité.",

    "feedCard.hidePost": "Masquer le post",

    "feedCard.deleteConfirmTitle": "Supprimer ce post ?",

    "feedCard.deleteConfirmMsg": "Êtes-vous absolument sûr ? Cette action est permanente.",

    "feedCard.delete": "Supprimer",

    "feedCard.cancel": "Annuler",

    "feedCard.update": "Mettre à jour",

    "feedCard.captionUpdated": "Légende mise à jour avec succès.",

    "feedCard.hashtagsUpdated": "Hashtags mis à jour avec succès.",

    "feedCard.categorySaved": "Catégorie enregistrée avec succès.",

    "feedCard.privacyUpdated": "Confidentialité mise à jour avec succès.",

    "feedCard.giftPrefsApplied": "Préférences de cadeaux appliquées.",

    "feedCard.postReported": "Post signalé avec succès.",

    "feedCard.postHidden": "Post masqué du fil.",

    "feedCard.postDeleted": "Post supprimé avec succès.",

    "feedCard.followError": "Impossible de mettre à jour le statut d'abonnement",

    "feedCard.reshareError": "Impossible de repartager le post. Veuillez réessayer.",

    "feedCard.favoritesError": "Impossible de mettre à jour les favoris.",

    "feedCard.giftFailed": "Échec de l'envoi du cadeau.",

    "feedCard.giftForbidden": "Cadeaux interdits",

    "giftSwitch.title": "Recevoir des cadeaux",

    "giftSwitch.subtitle": "Permettre aux gens d'envoyer des cadeaux virtuels sur ce post",

    "stories.yourStory": "Votre story",

    "stories.storyPublished": "Story publiée !",

    "stories.storyPublishedMsg": "Votre story est en ligne et disparaîtra dans 24 heures.",

    "stories.storyError": "Une erreur s'est produite lors du partage de votre story.",

    "stories.storyFailedDraftKept": "Votre story n'a pas pu être publiée. Elle est enregistrée — touchez Votre story pour réessayer.",

    "createPost.placeholder": "Que se passe-t-il sur votre campus ?",
    "createPost.title": "Créer une publication",
    "createPost.preview": "Aperçu",

    "post.replyingTo": "Répondre à {{name}}",

    "post.writeComment": "écrire un commentaire...",

    "post.writeReply": "écrire une réponse...",

    "post.viewReply": "Voir {{count}} réponse",

    "post.tagPeople": "Taguer des personnes",

    "hostel.addressLabel": "Adresse",

    "hostel.addressPlaceholder": "12 Ugbowo Road",

    "hostel.cityLabel": "Ville",

    "hostel.cityPlaceholder": "Benin City",

    "hostel.stateLabel": "État",

    "hostel.statePlaceholder": "Edo",

    "hostel.pricingLabel": "Loyer annuel",

    "hostel.pricingPlaceholder": "250000",

    "hostel.serviceChargeLabel": "Frais de service",

    "hostel.serviceChargePlaceholder": "20000",

    "hostel.cautionFeeLabel": "Caution",

    "hostel.cautionFeePlaceholder": "15000",

    "hostel.totalCost": "Coût total",

    "hostel.rulesTitle": "Règles & Politiques",

    "hostel.rulesSubtitle": "Informez les étudiants avant la réservation.",

    "hostel.visitorsAllowed": "Visiteurs autorisés",

    "hostel.visitorsAllowedDesc": "Les étudiants peuvent recevoir des visiteurs.",

    "hostel.smokingAllowedRule": "Fumer autorisé",

    "hostel.smokingAllowedDesc": "Le tabac est autorisé.",

    "hostel.petsAllowedRule": "Animaux autorisés",

    "hostel.petsAllowedDesc": "Les étudiants peuvent avoir des animaux.",

    "hostel.generatorAvailable": "Groupe électrogène disponible",

    "hostel.generatorAvailableDesc": "Électricité de secours disponible.",

    "hostel.curfewTime": "Heure de couvre-feu",

    "hostel.curfewPlaceholder": "22h00",

    "hostel.additionalRulesLabel": "Règles supplémentaires",

    "hostel.additionalRulesPlaceholder": "Pas de musique forte après 22h...",

  // ── Materials / Academic ─────────────────────────────────────
  "materials.title": "Ressources académiques",
  "materials.subtitle": "Sujets d'examens, notes de cours et supports d'étude",
  "materials.browseCategory": "Parcourir par catégorie",
  "materials.pastQuestionsCount": "1000+ Questions",
  "materials.lectureNotes": "Notes de cours",
  "materials.lectureNotesFormat": "PDF, DOC & Diapositives",
  "materials.textbooks": "Manuels",
  "materials.textbooksDesc": "Livres recommandés",
  "materials.projectTopics": "Sujets de projet",
  "materials.projectTopicsDesc": "Idées de recherche",
  "materials.assignments": "Devoirs",
  "materials.assignmentsDesc": "Devoirs & Tâches",
  "materials.practicals": "Travaux pratiques",
  "materials.practicalsDesc": "Manuels de laboratoire",
  "materials.pastQuestions": "Sujets d'examens",
  "materials.notes": "Notes de cours",
  "materials.upload": "Télécharger un document",

  // ── Marketplace ──────────────────────────────────────────────
  "marketplace.title": "Marketplace",
  "marketplace.sell": "Vendre",
  "marketplace.buy": "Acheter",
  "marketplace.noItems": "Aucun article listé",
  "marketplace.subtitle": "Achetez, vendez & échangez avec les étudiants",
  "marketplace.searchPlaceholder": "Rechercher articles, marques...",
  "marketplace.postMessage": "Publier un article",
  "marketplace.price": "Prix",
  "marketplace.negotiable": "Négociable",

  // ── Events ───────────────────────────────────────────────────
  "events.title": "Événements",
  "events.subtitle": "Activités à venir, ateliers & rencontres campus",

  // ── Jobs ─────────────────────────────────────────────────────
  "jobs.title": "Emplois & Stages",
  "jobs.subtitle": "Opportunités de carrière, postes débutants & jobs étudiants",
  "jobs.searchPlaceholder": "Rechercher emplois, entreprises...",
  "jobs.detailTitle": "Détails de l'emploi",
  "jobs.detailSubtitle": "Conditions, processus de candidature et aperçu du poste",
  "jobs.loadingDetails": "Chargement des détails...",
  "jobs.notFound": "Emploi non trouvé",
  "jobs.notFoundDesc": "Cette offre a peut-être été supprimée",
  "jobs.description": "Description",
  "jobs.requirements": "Prérequis",
  "jobs.benefits": "Avantages",
  "jobs.applicants": "candidats",
  "jobs.viewManage": "Voir et gérer les candidats",
  "jobs.applyNow": "Postuler maintenant",
  "jobs.applyTo": "Postuler à {{company}}",
  "jobs.coverLetterHint": "Rédigez une lettre de motivation convaincante",
  "jobs.coverLetterPlaceholder": "Madame, Monsieur, je suis intéressé par...",
  "jobs.submitApplication": "Soumettre la candidature",
  "jobs.applications": "Candidatures",
  "jobs.deleteJob": "Supprimer l'offre",
  "jobs.deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette offre ?",
  "jobs.applicationSent": "Candidature envoyée !",
  "jobs.applicationSubmitted": "Votre candidature a été soumise.",
  "jobs.statusUpdated": "Statut mis à jour",
  "jobs.jobDeleted": "Offre supprimée",
  "jobs.failedToLoad": "Échec du chargement",
  "jobs.failedToApply": "Échec de la candidature",
  "jobs.failedToLoadApps": "Échec du chargement des candidatures",
  "jobs.failedToUpdate": "Échec de la mise à jour",
  "jobs.failedToDelete": "Échec de la suppression",
  "jobs.pleaseWriteCover": "Veuillez rédiger une lettre de motivation",
  "jobs.loadingApplications": "Chargement des candidatures...",
  "jobs.noApplications": "Aucune candidature pour le moment",

  // ── Wallet / Coins ───────────────────────────────────────────
  "wallet.title": "Portefeuille",
  "wallet.balance": "Solde",
  "wallet.coins": "Coins",
  "wallet.transactions": "Transactions",
  "wallet.earn": "Gagner des coins",
  "wallet.spend": "Dépenser des coins",
  "wallet.dailyFree": "Cadeau quotidien gratuit",

  // ── Home / Feed ──────────────────────────────────────────────
  "home.title": "Accueil",

  // ── Search ───────────────────────────────────────────────────
  "search.title": "Trouver des champions",
  "search.subtitle": "Rechercher des personnes, écoles ou cours",
  "search.noResults": "Aucun résultat trouvé",
  "search.searchPlaceholder": "Rechercher...",
  "search.showingResults": "Résultats pour \"{{query}}\"",
  "search.noResultsFound": "Aucun étudiant trouvé pour \"{{query}}\"",
  "search.recentSearches": "Recherches récentes ({{count}})",
  "search.clearAll": "Tout effacer",
  "search.noRecentSearches": "Pas encore de recherches récentes.",
  "search.suggestedStudents": "Étudiants suggérés",
  "search.noSuggestedStudents": "Aucun étudiant suggéré trouvé.",
  "search.trendingStudents": "Étudiants populaires",
  "search.noTrendingStudents": "Aucun étudiant populaire trouvé.",
  "search.follow": "Suivre",
  "search.following": "Abonné",

  // ── Search Results ───────────────────────────────────────────
  "searchResults.all": "Tous",
  "searchResults.people": "Personnes",
  "searchResults.schools": "Écoles",
  "searchResults.courses": "Cours",
  "searchResults.unknownSchool": "École inconnue",
  "searchResults.unknownDept": "Département inconnu",
  "searchResults.student": "Étudiant",

  // ── Followers ────────────────────────────────────────────────
  "followers.title": "Abonnés",
  "followers.following": "Abonnements",
  "followers.noFollowers": "Pas encore d'abonnés",
  "followers.noFollowing": "Ne suit personne",
  "followers.couldNotLoad": "Impossible de charger",
  "followers.couldNotUpdate": "Impossible de mettre à jour le statut d'abonnement",

  // ── Change Password ──────────────────────────────────────────
  "password.title": "Changer le mot de passe",
  "password.subtitle": "Mettre à jour le mot de passe de votre compte",
  "password.currentPassword": "Mot de passe actuel",
  "password.newPassword": "Nouveau mot de passe",
  "password.confirmNewPassword": "Confirmer le nouveau mot de passe",
  "password.currentPlaceholder": "Entrez le mot de passe actuel",
  "password.newPlaceholder": "Entrez le nouveau mot de passe",
  "password.confirmPlaceholder": "Confirmez le nouveau mot de passe",
  "password.updateButton": "Mettre à jour le mot de passe",
  "password.updatedSuccess": "Mot de passe mis à jour avec succès",
  "password.couldNotUpdate": "Impossible de mettre à jour le mot de passe",
  "password.fieldsRequired": "Veuillez remplir tous les champs",
  "password.noMatch": "Les mots de passe ne correspondent pas",
  "password.tooShort": "Le mot de passe doit contenir au moins 8 caractères",

  // ── Edit Profile ─────────────────────────────────────────────
  "editProfile.title": "Modifier le profil",
  "editProfile.firstName": "Prénom",
  "editProfile.lastName": "Nom",
  "editProfile.username": "Nom d'utilisateur",
  "editProfile.bio": "Bio",
  "editProfile.school": "École",
  "editProfile.department": "Département",
  "editProfile.level": "Niveau",
  "editProfile.phoneNumber": "Numéro de téléphone",
  "editProfile.saveChanges": "Enregistrer les modifications",
  "editProfile.profileUpdated": "Profil mis à jour avec succès",
  "editProfile.couldNotUpdate": "Impossible de mettre à jour le profil",
  "editProfile.changePhoto": "Changer la photo",
  "editProfile.takePhoto": "Prendre une photo",
  "editProfile.chooseFromLibrary": "Choisir dans la bibliothèque",
  "editProfile.cancel": "Annuler",

  // ── Account Action ───────────────────────────────────────────
  "account.deactivate": "Désactiver le compte",
  "account.delete": "Supprimer le compte",
  "account.deactivateTitle": "Désactiver le compte ?",
  "account.deleteTitle": "Supprimer le compte ?",
  "account.deactivateConfirm": "Êtes-vous sûr de vouloir désactiver votre compte ? Vous pourrez le réactiver plus tard.",
  "account.deleteConfirm": "Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.",
  "account.cannotBeUndone": "Cette action est irréversible.",
  "account.deactivateButton": "Désactiver mon compte",
  "account.deleteButton": "Supprimer mon compte",
  "account.deactivatedSuccess": "Compte désactivé",
  "account.deletedSuccess": "Compte supprimé",

  // ── Storage & Cache ──────────────────────────────────────────
  "storage.title": "Stockage et cache",
  "storage.subtitle": "Gérer les données en cache",
  "storage.imageCache": "Cache d'images",
  "storage.imageCacheDesc": "Photos de profil et médias en cache",
  "storage.videoCache": "Cache vidéo",
  "storage.videoCacheDesc": "Fichiers d'animation pré-téléchargés",
  "storage.thumbnailCache": "Cache de miniatures",
  "storage.thumbnailCacheDesc": "Images de prévisualisation vidéo générées",
  "storage.messageCache": "Cache de messages",
  "storage.messageCacheDesc": "Messages de chat hors ligne",
  "storage.clearAll": "Vider tout le cache",
  "storage.clearAllConfirm": "Êtes-vous sûr de vouloir vider toutes les données en cache ?",
  "storage.cacheCleared": "Cache vidé avec succès",
  "storage.cleared": "Vidé",

  // ── Report Problem ───────────────────────────────────────────
  "report.title": "Signaler un problème",
  "report.subtitle": "Dites-nous ce qui ne va pas",
  "report.description": "Description",
  "report.descriptionPlaceholder": "Décrivez ce qui s'est passé...",
  "report.submitReport": "Soumettre le rapport",
  "report.submitting": "Soumission...",
  "report.success": "Rapport soumis avec succès",
  "report.couldNotSubmit": "Impossible de soumettre le rapport",
  "report.descriptionRequired": "Veuillez décrire le problème",

  // ── Levels / Leaderboard ─────────────────────────────────────
  "levels.title": "Niveaux",
  "levels.yourLevel": "Votre niveau",
  "levels.nextLevel": "Niveau suivant",
  "levels.pointsToNext": "{{points}} points pour le niveau suivant",
  "leaderboard.title": "Classement",
  "leaderboard.subtitle": "Classements & réalisations actives",
  "leaderboard.thisWeek": "Cette semaine",
  "leaderboard.allTime": "Tout temps",
  "leaderboard.rank": "Rang",
  "leaderboard.points": "Points",

  // ── Story ────────────────────────────────────────────────────
  "story.viewStory": "Voir l'histoire",

  // ── Two-Factor Auth ──────────────────────────────────────────
  "twofa.title": "Authentification à deux facteurs",
  "twofa.enable": "Activer 2FA",
  "twofa.disable": "Désactiver 2FA",
  "twofa.enterCode": "Entrez le code de vérification",
  "twofa.codeSent": "Code de vérification envoyé",
  "twofa.couldNotSend": "Impossible d'envoyer le code de vérification.",
  "twofa.enabled": "2FA activé avec succès",
  "twofa.disabled": "2FA désactivé avec succès",
  "twofa.invalidCode": "Code de vérification invalide",

  // ── Two-Factor Verify ────────────────────────────────────────
  "twofaVerify.title": "Vérifier l'identité",
  "twofaVerify.subtitle": "Entrez le code envoyé à votre appareil",
  "twofaVerify.verify": "Vérifier",
  "twofaVerify.resend": "Renvoyer le code",
  "twofaVerify.codeSent": "Un nouveau code a été envoyé",
  "twofaVerify.invalidCode": "Code invalide. Veuillez réessayer.",
  "twofaVerify.verified": "Identité vérifiée avec succès",

  // ── Waveform Settings ────────────────────────────────────────
  "waveform.headerTitle": "Forme d'onde des messages vocaux",
  "waveform.shape": "FORME",
  "waveform.barCount": "Nombre de barres",
  "waveform.barCountDesc": "Combien de barres composent la forme d'onde",
  "waveform.barCountFormat": "{{count}} barres",
  "waveform.barWidth": "Largeur des barres",
  "waveform.barWidthDesc": "Épaisseur de chaque barre",
  "waveform.barWidthFormat": "{{count}}px",
  "waveform.barGap": "Espacement des barres",
  "waveform.barGapDesc": "Espacement entre les barres",
  "waveform.barGapFormat": "{{count}}px",
  "waveform.maxHeight": "Hauteur maximale",
  "waveform.maxHeightDesc": "Hauteur des barres les plus hautes",
  "waveform.maxHeightFormat": "{{count}}px",
  "waveform.color": "COULEUR",
  "waveform.trackOpacity": "Opacité de la piste",
  "waveform.trackOpacityDesc": "Apparence des barres non lues",
  "waveform.trackOpacityFormat": "{{count}}%",
  "waveform.playedBarColor": "Couleur des barres lues",
  "waveform.playedBarColorDesc": "Correspond automatiquement à la bulle — glissez pour choisir une couleur",
  "waveform.auto": "Auto",
  "waveform.autoMatchesBubble": "Auto (correspond à la bulle)",
  "waveform.animation": "ANIMATION",
  "waveform.pulseSpeed": "Vitesse de pulsation",
  "waveform.pulseSpeedDesc": "Durée d'une pulsation de barre",
  "waveform.pulseSpeedFormat": "{{count}}ms",
  "waveform.waveSpeed": "Vitesse de l'onde",
  "waveform.waveSpeedDesc": "Décalage entre les barres — plus petit balaye plus vite",
  "waveform.waveSpeedFormat": "{{count}}ms",
  "waveform.pulseDepth": "Profondeur de pulsation",
  "waveform.pulseDepthDesc": "Rétrécissement des barres pendant la lecture",
  "waveform.pulseDepthFormat": "{{count}}%",
  "waveform.resetDefaults": "Réinitialiser les paramètres par défaut",
  "waveform.preview": "Aperçu en direct",
  "waveform.settingsRestored": "Paramètres waveform réinitialisés aux valeurs par défaut",
  "waveform.saved": "Paramètres enregistrés",

  // ── AI Assistant ─────────────────────────────────────────────
  "ai.title": "Assistant IA",
  "ai.subtitle": "Chat et aide instantanée",
  "ai.newChat": "Nouvelle conversation",
  "ai.heroTitle": "Assistant IA",
  "ai.heroSubtitle": "Votre compagnon intelligent\npour toute question ou tâche.",
  "ai.heroGreeting": "Bonjour ! Comment puis-je\nvous aider aujourd'hui ?",
  "ai.recentChats": "Discussions récentes",
  "ai.noChats": "Aucune discussion récente. Commencez une nouvelle conversation !",
  "ai.untitledChat": "Discussion sans titre",
  "ai.tapToContinue": "Appuyez pour continuer la conversation",
  "ai.listening": "Écoute... (Appuyez sur le micro pour terminer)",
  "ai.askAnything": "Demandez n'importe quoi...",
  "ai.deleteChat": "Supprimer la discussion",
  "ai.deleteChatConfirm": "Êtes-vous sûr de vouloir supprimer cette discussion ?",
  "ai.couldNotDelete": "Impossible de supprimer la conversation. Veuillez réessayer.",
  "ai.permissionCamera": "L'accès à la bibliothèque photo est requis !",
  "ai.permissionMic": "L'accès au microphone est requis.",
  "ai.errorSending": "Erreur lors de l'envoi",
  "ai.failedProcess": "Échec du traitement. Veuillez réessayer.",
  "ai.noResponse": "Aucune réponse reçue.",

  // ── Coming Soon ──────────────────────────────────────────────
  "comingSoon.badge": "BIENTÔT DISPONIBLE",
  "comingSoon.title": "Quelque chose\nd'incroyable arrive !",
  "comingSoon.subtitle": "Nous travaillons dur pour vous offrir\nune expérience nouvelle et passionnante.",
  "comingSoon.stayTuned": "Restez connecté !",
  "comingSoon.newFeatures": "Nouvelles fonctionnalités",
  "comingSoon.newFeaturesDesc": "Des outils puissants pour une meilleure version de vous",
  "comingSoon.betterExperience": "Meilleure expérience",
  "comingSoon.betterExperienceDesc": "Plus fluide, plus rapide et plus intelligent",
  "comingSoon.excitingRewards": "Récompenses passionnantes",
  "comingSoon.excitingRewardsDesc": "Plus de récompenses vous attendent",
  "comingSoon.ctaTitle": "Soyez le premier à savoir !",
  "comingSoon.ctaSubtitle": "Nous vous notifierons dès le lancement.",
  "comingSoon.notifyMe": "Me notifier",
  "comingSoon.notified": "Notifié !",
  "comingSoon.goBack": "Retour à l'accueil",
  "comingSoon.onTheList": "Vous êtes sur la liste !",
  "comingSoon.willNotify": "Nous vous notifierons dès le lancement.",

  // ── Notes ────────────────────────────────────────────────────
  "notes.title": "Notes",
  "notes.subtitle": "Supports de cours, résumés de cours et guides partagés",
  "notes.allNotes": "Toutes les notes",
  "notes.classes": "Cours",
  "notes.personal": "Personnel",
  "notes.bookmarks": "Favoris",
  "notes.searchPlaceholder": "Rechercher des notes...",
  "notes.pinned": "Épinglées ({{count}})",
  "notes.recentNotes": "Notes récentes",
  "notes.noNotes": "Aucune note trouvée",
  "notes.noNotesHint": "Appuyez sur \"+\" pour rédiger une note ou ajustez votre recherche.",
  "notes.newNote": "Nouvelle note",
  "notes.editNote": "Modifier la note",
  "notes.category": "Catégorie",
  "notes.noteTitle": "Titre de la note",
  "notes.noteContent": "Commencez à écrire vos notes de cours ici...",
  "notes.general": "Général",
  "notes.missingFields": "Veuillez saisir un titre et un contenu.",
  "notes.failedToFetch": "Échec du chargement des notes depuis le serveur.",
  "notes.failedToRefresh": "Échec de l'actualisation des notes.",
  "notes.failedToSave": "Échec de l'enregistrement de la note sur le serveur.",
  "notes.failedToPin": "Échec de la mise à jour de l'état d'épinglage.",
  "notes.failedToBookmark": "Échec de la mise à jour de l'état de favori.",
  "notes.failedToDelete": "Échec de la suppression de la note.",
  "notes.deleteNote": "Supprimer la note",
  "notes.deleteConfirm": "Êtes-vous sûr de vouloir supprimer cette note ?",

  // ── Past Questions ───────────────────────────────────────────
  "pastQ.uploadTitle": "Télécharger un sujet d'examen",
  "pastQ.uploadSubtitle": "Aidez vos camarades à réussir",
  "pastQ.tips": "Conseils de téléchargement",
  "pastQ.verifiedOnly": "Réservé aux étudiants vérifiés",
  "pastQ.verifiedDesc": "Les sujets ne sont visibles que par les étudiants de votre institution.",
  "pastQ.academicDetails": "Informations académiques",
  "pastQ.academicDetailsHint": "Assurez-vous que ces informations sont correctes.",
  "pastQ.level": "Niveau",
  "pastQ.selectLevel": "Sélectionner le niveau",
  "pastQ.courseCode": "Code du cours",
  "pastQ.courseCodePlaceholder": "ex. CSC 312",
  "pastQ.courseTitle": "Titre du cours / Matière",
  "pastQ.courseTitlePlaceholder": "ex. Structures de données",
  "pastQ.academicSession": "Année académique",
  "pastQ.selectSession": "Sélectionner l'année",
  "pastQ.examSemester": "Semestre d'examen",
  "pastQ.uploadFiles": "Télécharger des fichiers",
  "pastQ.uploadFilesHint": "Téléchargez des fichiers clairs. Plusieurs fichiers possibles.",
  "pastQ.tapToUpload": "Appuyez pour télécharger",
  "pastQ.fileFormats": "JPG, PNG jusqu'à 10 Mo chacun",
  "pastQ.addMore": "Ajouter des fichiers",
  "pastQ.disclaimerTitle": "Veuillez vous assurer :",
  "pastQ.disclaimerBullet1": "Les sujets proviennent de votre institution.",
  "pastQ.disclaimerBullet2": "Des téléchargements trompeurs peuvent entraîner une suspension.",
  "pastQ.uploading": "Téléchargement...",
  "pastQ.uploadButton": "Télécharger le sujet",
  "pastQ.onlyInstitution": "Seuls les étudiants de votre institution peuvent voir ce contenu.",
  "pastQ.selectOption": "Sélectionner {{type}}",
  "pastQ.uploadSuccess": "Votre sujet d'examen a été téléchargé.",
  "pastQ.uploadSuccessful": "Téléchargement réussi",
  "pastQ.failedToLoad": "Échec du chargement des sujets d'examen.",
  "pastQ.noDownloadLink": "Aucun lien de téléchargement disponible pour ce fichier.",

  // ── Student Verification ─────────────────────────────────────
  "verification.title": "Vérification étudiant",
  "verification.subtitle": "Vérifiez votre identité scolaire",
  "verification.studentId": "Carte d'étudiant",
  "verification.admissionLetter": "Lettre d'admission",
  "verification.uploadId": "Télécharger la carte d'étudiant",
  "verification.uploadLetter": "Télécharger la lettre d'admission",
  "verification.confirmDocs": "Je confirme que ces documents m'appartiennent",
  "verification.submit": "Soumettre pour vérification",
  "verification.submitting": "Soumission...",
  "verification.successMsg": "Vos documents ont été soumis. La vérification prend généralement moins de 24 heures.",
  "verification.successTitle": "Vérification en cours",
  "verification.uploadAtLeast": "Veuillez télécharger au moins un document.",
  "verification.confirmDocuments": "Veuillez confirmer que les documents vous appartiennent.",

  // ── Errors ───────────────────────────────────────────────────
  "error.generic": "Une erreur s'est produite. Veuillez réessayer.",
  "error.network": "Pas de connexion internet. Vérifiez votre réseau.",
  "error.unauthorized": "Votre session a expiré. Veuillez vous reconnecter.",
  "error.notFound": "Le contenu que vous recherchez est introuvable.",
  "error.permission": "Vous n'avez pas la permission de faire cela.",
  "error.couldNotSend": "Impossible d'envoyer. Veuillez réessayer.",
  "error.couldNotLoad": "Impossible de charger les données. Veuillez réessayer.",
  "error.couldNotDelete": "Impossible de supprimer. Veuillez réessayer.",
  "error.couldNotSave": "Impossible d'enregistrer. Veuillez réessayer.",
  "error.permissionDenied": "Permission refusée",
  "error.error": "Erreur",

  // ── Success ──────────────────────────────────────────────────
  "success.saved": "Enregistré avec succès",
  "success.sent": "Envoyé avec succès",
  "success.deleted": "Supprimé avec succès",
  "success.updated": "Mis à jour avec succès",
  "success.copied": "Copié dans le presse-papiers",
  "success.success": "Succès",

  // ── Misc ─────────────────────────────────────────────────────
  "misc.today": "Aujourd'hui",
  "misc.yesterday": "Hier",
  "misc.thisWeek": "Cette semaine",
  "misc.older": "Plus ancien",
  "misc.justNow": "À l'instant",
  "misc.minutesAgo": "il y a {{count}} min",
  "misc.hoursAgo": "il y a {{count}}h",
  "misc.daysAgo": "il y a {{count}}j",
  "misc.giftReceived": "Cadeau reçu 🎁",
  "misc.giftSent": "{{name}} vous a envoyé un cadeau !",
  "misc.levelUp": "Vous avez niveau supérieur !",
  "misc.newFollower": "{{name}} a commencé à vous suivre",
  "misc.comingSoon": "Bientôt disponible",
  "misc.noResults": "Aucun résultat trouvé",
  "misc.pullToRefresh": "Tirez pour actualiser",
  "misc.cancel": "Annuler",
  "misc.tryAgain": "Réessayer",

  // ── Quick Actions ────────────────────────────────────────────
  "quickactions.title": "Actions Rapides",
  "quickactions.leaderboard": "Classement",
  "quickactions.marketplace": "Marketplace",
  "quickactions.hostels": "Foyers",
  "quickactions.events": "Événements",
  "quickactions.groups": "Groupes",
  "quickactions.achievement": "Succès",
  "quickactions.jobs": "Emplois",
  "quickactions.notes": "Mes Notes",
  "quickactions.games": "Jeux",
  "quickactions.aiTutor": "Tuteur IA",
  "quickactions.elections": "Élections",
};

export default fr;

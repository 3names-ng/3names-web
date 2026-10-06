// translations/ig.ts
// Igbo

import type { TranslationKey } from "./en";

const ig: Partial<Record<TranslationKey, string>> = {
  // ── Navigation / Tabs ────────────────────────────────────────
  "tab.home": "Ụlọ",
  "tab.explore": "Chọgharịa",
  "tab.messages": "Ozi",
  "tab.following": "Na-eso",
  "tab.materials": "Akụrụngwa",
  "tab.profile": "Profaịlụ",

  // ── Common Actions ───────────────────────────────────────────
  "action.back": "Laghachi",
  "action.done": "Emeela",
  "action.cancel": "Kagbuo",
  "action.save": "Chekwaa",
  "action.delete": "Hichapụ",
  "action.edit": "Gbanwee",
  "action.send": "Ziga",
  "action.confirm": "Nyochaa",
  "action.yes": "Ee",
  "action.no": "Mba",
  "action.close": "Mechie",
  "action.retry": "Nwaa ọzọ",
  "action.submit": "Nyechaa",
  "action.next": "Esi na nke a",
  "action.previous": "Nke gara aga",
  "action.apply": "Jiri",
  "action.search": "Chọọ",
  "action.loading": "Na-adọwnloads...",
  "action.refresh": "Mee ọhụrụ",
  "action.share": "Tụnye",
  "action.copy": "Detuwetụ",
  "action.viewAll": "Lee Niile",
  "action.seeMore": "Lee ọzọ",
  "action.seeLess": "Lee nke ntakịrị",
  "action.learnMore": "Mụtọkwara",
  "action.submitting": "Na-enye...",
  "action.deactivate": "Kagbuo",

  // ── Auth ─────────────────────────────────────────────────────
  "auth.login": "Banye",
  "auth.signup": "Dee aha",
  "auth.logout": "Pụọ",
  "auth.forgotPassword": "Chefuru Paswọọdụ?",
  "auth.resetPassword": "Tọgharia Paswọọdụ",
  "auth.enterEmail": "Tinye adreesị email gị",
  "auth.enterPassword": "Tinye paswọọdụ gị",
  "auth.confirmPassword": "Nyochaa paswọọdụ gị",
  "auth.email": "Imel",
  "auth.password": "Paswọọdụ",
  "auth.fullName": "Aha zuru oke",
  "auth.username": "Aha ọrụ",
  "auth.phone": "Namba ekwentị",
  "auth.noAccount": "Ị nweghị akawnt?",
  "auth.hasAccount": "Ị nwere akawnt taa?",
  "auth.continueWithGoogle": "Gaa n'ihu na Google",

  // ── Profile ──────────────────────────────────────────────────
  "profile.title": "Profaịlụ",
  "profile.editProfile": "Gbanwee Profaịlụ",
  "profile.followers": "Ndị na-eso",
  "profile.following": "Na-eso",
  "profile.posts": "Eddy",
  "profile.follow": "Soro",
  "profile.unfollow": "Rụso aka",
  "profile.followingYou": "Na-eso gị",
  "profile.block": "Chekwaa",
  "profile.unblock": "Wepụ Chekwaa",
  "profile.report": "Kọọ",
  "profile.message": "Ozi",
  "profile.shareProfile": "Tụnye Profaịlụ",
  "profile.manageAccount": "Jikwaa ihe niile banyere akawnt gị",
  "profile.account": "AKAWNT",
  "profile.activity": "OMUME",
  "profile.studentVerification": "Nnyocha Ndi Ntị",
  "profile.verifyIdentity": "Nyochaa ahụmịhe akwụkwọ gị",
  "profile.achievements": "Ihe ị ga-ahụ",
  "profile.likes": "Masịrị",
  "profile.gifts": "Ego",
  "profile.anonymousStudent": "Nwatakọrịrị Agha",
  "profile.tabPosts": "Eddy",
  "profile.tabReshares": "Nkesa",
  "profile.tabDrafts": "Ntụsa",
  "profile.tabHidden": "Echekwabụrụ",
  "profile.tabSaved": "Echekwabụrụ",
  "profile.tabTagged": "Akatọrọ",
  "profile.noContent": "Enweghị Ihe",
  "profile.emptyTab": "Enweghị {{tab}} chọtara",

  // ── Settings ─────────────────────────────────────────────────
  "settings.title": "Ntọala",
  "settings.notifications": "Ọkwa",
  "settings.privacySecurity": "Nzuzo na Echekwa",
  "settings.language": "Asụsụ",
  "settings.appearance": "Ihe ị Ga-ahụ",
  "settings.dark": "Ọchịchịrị",
  "settings.light": "Agba",
  "settings.storageCache": "Nchekwa na Cache",
  "settings.helpSupport": "Enyemaka na Nkwado",
  "settings.reportProblem": "Kọọ nsogbu",
  "settings.blockedUsers": "Ndị a chọkwala",
  "settings.accountAction": "Akawnt",
  "settings.deactivateAccount": "Kagbuo Akawnt",
  "settings.deleteAccount": "Hichapụ Akawnt",
  "settings.onlineStatus": "Ọnọdụ n'ime",
  "settings.readReceipts": "kwatee ngụ",
  "settings.activityStatus": "ọrụ ọnọdụ",
  "settings.marketplace": "ahịa",
  "settings.hostel": "ụlọ",
  "settings.leaderboard": "azụmahịa",
  "settings.general": "nzukọ",
  "settings.soundEnabled": "ozi",
  "settings.waveform": "Usoro Olu",
  "settings.waveformDesc": "Jikwaa ha ahụ",
  "settings.manageCachedData": "Jikwaa data cache",

  // ── Language ─────────────────────────────────────────────────
  "language.title": "Asụsụ",
  "language.select": "HỌPỤRỤ ASỤSỤ GỊ",
  "language.updated": "Asụsụ agbanwere",
  "language.setTo": "Asụsụ dọtụla na {{language}}",
  "language.footer":
    "Asụsụ app ga-agbanwe n'ime metụtara metụtara. Ụfọdụ ihe ndị ọzọ n'aka ndị ọzọ nwere ike iri n'asụsụ ha.",

  // ── Messages / Chat ──────────────────────────────────────────
  "chat.title": "Ozi",
  "chat.subtitle": "Jikọrọ na ndị mma",
  "chat.searchPlaceholder": "Chọọ ozi...",
  "chat.noMessages": "Ozi adịghị ahụ nye",
  "chat.startConversation": "Bido mkparịta ụka",
  "chat.typeMessage": "Pịa ozi...",
  "chat.updateMessage": "Emelite ozi...",
  "chat.loading": "Na-emebi chat...",
  "chat.send": "Ziga",
  "chat.online": "N'ime",
  "chat.offline": "Adịghị n'ime",
  "chat.typing": "na-apakọ...",
  "chat.leftTheChat": "{{name}} apụrụ chat",
  "chat.joinedTheChat": "{{name}} banyere chat",
  "chat.sentGift": "{{name}} ziri {{gift}} x{{count}}",
  "chat.pinnedMessage": "Ozi edepụtara",
  "chat.unpinMessage": "Wepụ Depụta",
  "chat.replyTo": "Zaghachi {{name}}",
  "chat.jumpToMessage": "Gaa n'ozii",
  "chat.messageNotInView": "Ozi adịghị n'anya",
  "chat.messageNotLoaded": "Ozi asụsụ adịghị ahụ n'ime chat a.",
  "chat.deleteMessage": "Hichapụ Ozi",
  "chat.editMessage": "Gbanwee Ozi",
  "chat.copyMessage": "Detuwetụ",
  "chat.replyMessage": "Zaghachi",
  "chat.pinMessage": "Depụta Ozi",
  "chat.deleteConfirmTitle": "Hichapụ ozi a?",
  "chat.deleteConfirmBody": "Omume a abụghị nke a ga-ewegharịa.",
  "chat.messageUpdated": "Ozi emelite",
  "chat.messageDeleted": "Ozi ehichapụla",
  "chat.couldNotDeleteMessage": "Enweghị ike hichapụ ozi",
  "chat.couldNotSendVoiceNote": "Enweghị ike iziga ozi olu",
  "chat.couldNotStartRecording": "Enweghị ike ibido nchụgharị",
  "chat.couldNotStopRecording": "Enweghị ike izọ aka nchụgharị",
  "chat.permissionMediaRequired": "A chọrọ ikike n'ime ekwentị multimedia.",
  "chat.permissionMicRequired": "A chọrọ ikike ekwentị maka nchụgharị ozi olu.",
  "chat.connectionFailed": "Njikọlaghachi",
  "chat.showingSavedMessages": "Adịghị na net — na-agosi ozi gị nchekwara.",
  "chat.chatError": "Nsogbu Chat",
  "chat.couldNotStart": "Enweghị ike ibido mkparịta ụka.",
  "chat.couldNotSendGift": "Enweghị ike iziga eke",
  "chat.notificationsMuted": "Ọkwa Emechiri",
  "chat.notificationsUnmuted": "Ọkwa Emelitere",
  "chat.chatBubbleUpdated": "Bubble chat emelite",
  "chat.couldNotSyncBubble": "Enweghị ike jikọọ usoro bubble",
  "chat.actionFailed": "Omume Agwaraghị",
  "chat.deleteChat": "Hichapụ Chat",
  "chat.deleteChatConfirm": "Hichapụ chat a?",
  "chat.deleteChatBody": "Ozi niile ga-apapụọ n'oge niile.",
  "chat.chatDeleted": "Chat Ehichapụla",
  "chat.couldNotDeleteChat": "Enweghị ike hichapụ chat",
  "chat.customizeBubble": "Hazee Bubble",
  "chat.chatBackground": "N'ezzie Chat",
  "chat.sharedMedia": "Makuru Ekekọrịtara",
  "chat.viewProfile": "Lee Profaịlụ",
  "chat.mute": "Mechie Olu",
  "chat.unmute": "Meghee Olu",
  "chat.pinChat": "Depụta Chat",
  "chat.unpinChat": "Wepụ Depụta Chat",
  "chat.searchMembers": "Chọọ ndị otu...",
  "chat.left": "apụrụ",
  "chat.joined": "banyere",
  "chat.pinned": "depụtara",
  "chat.unpinned": "wepụrụ depụta",
  "chat.addReaction": "Tinye azụmahịa",
  "chat.reply": "Zaghachi",
  "chat.replyToMessage": "Zaghachi {{name}}",
  "chat.cancelReply": "Kagbuo nzaghachi",
  "chat.gallery": "Ụlọ Akwụkwọ Mgbasa Ozi",
  "chat.document": "Akụkwọ",
  "chat.recordVoice": "Nchụgharị Olu",
  "chat.stopRecording": "Kagbuo Nchụgharị",
  "chat.cancelRecording": "Kagbuo",
  "chat.sendVoice": "Ziga",
  "chat.listenVoice": "Nweta",
  "chat.deleteVoice": "Hichapụ",
  "chat.messagePlaceholder": "Ozi",
  "chat.updatePlaceholder": "Emelite ozi...",
  "chat.typePlaceholder": "Pịa ozi...",
  "group.searchMembers": "Chọọ ndị otu...",
  "group.searchDefault": "Chọọ ndị ụmụ ezosiedere...",
  "group.searchMy": "Chọọ ndị ụmụ m...",

  // ── Posts / Feed ─────────────────────────────────────────────
  "post.like": "Hụrụ",
  "post.unlike": "Ụghaghị",
  "post.comment": "Kpara nzọ",
  "post.comments": "Nkọwa",
  "post.share": "Tụnye",
  "post.delete": "Hichapụ ede",
  "post.edit": "Gbanwee ede",
  "post.report": "Kọọ ede",
  "post.noPosts": "Ede adịghị ahụ nye",
  "post.writeSomething": "Dee ihe ọ bụla...",
  "post.likedBy": "Hụrụ site na {{name}}",
  "post.commentsCount": "nkọwa {{count}}",
  "post.loadingFeed": "Na-adọwnloads feed gị…",
  "post.noPostsInTab": "Adịghị ede n'ime {{tab}}",
  "post.beTheFirst": "Bụrụ nke mbụ ga-ede ma ọ bụ laghachiri n'azụ.",
  "post.refreshFeed": "Mee ọhụrụ Feed",
  "post.sharedToFeed": "Ede etinyela n'ime feed gị",
  "post.couldNotShare": "Enweghị ike tụnye ede a ugbu a.",
  "post.reportedSuccess": "Ede ekọọla nke ọma",
  "post.couldNotReport": "Enweghị ike kọọ ede a ugbu a.",
  "post.deletedSuccess": "Ede ehichapụla nke ọma",
  "post.commentsTitle": "Nkọwa",
  "post.noComments": "Adịghị nkọwa taa. Bụrụ nke mbụ!",
  "post.addComment": "Tinye nkọwa...",

  // ── Groups ───────────────────────────────────────────────────
  "group.title": "Ndị Ụmụ",
  "group.create": "Mepụta Ndị Ụmụ",
  "group.join": "Banye Ndị Ụmụ",
  "group.leave": "Pụọ Ndị Ụmụ",
  "group.members": "Ndị Ukwu",
  "group.member": "Onye Ukwu",
  "group.name": "Aha Ndị Ụmụ",
  "group.description": "Nkọwa",
  "group.noGroups": "Ndị Ụmụ adịghị ahụ",
  "group.searchPlaceholder": "Chọọ ndị ụmụ...",
  "group.online": "{{count}} n'ime",

  // ── Notifications ────────────────────────────────────────────
  "notifications.title": "Ọkwa",
  "notifications.noNotifications": "Ọkwa adịghị ahụ",
  "notifications.markAllRead": "Gosi niile e趋",
  "notifications.settings": "Ntọala Ọkwa",

  // ── Explore ──────────────────────────────────────────────────
  "explore.title": "Chọgharịa",
  "explore.searchPlaceholder": "Chọọ campus...",
  "explore.trending": "Na-ebu ume",
  "explore.latest": "Nke kachasị ọhụrụ",
  "explore.forYou": "Maka gị",
  "explore.searchTagUser": "Chọọ onye ọbụla iji mee ùgbu",
  "explore.searchTagMode": "Chọọ {{mode}} iji mee ùgbu",

    "explore.tagPeople": "Tag Ndị Mmadụ",

    "explore.followers": "Ndị Na-eso",

    "explore.following": "Ndị A Na-eso",

    "explore.selected": "{{count}} a hụrụ",

    "explore.typeToSearch": "Pịa ọchụrọ onye ọbụla.",

    "explore.noUsersToTag": "Enweghị {{mode}} iji tag.",

    "explore.postPreview": "Nyocha Post",

    "explore.feedPreview": "Nyocha Feed",

    "explore.privacyDistribution": "Nchezota & Nkwatọ",

    "explore.whoCanSee": "Onye nwere ike hụ post a",

    "explore.whoCanComment": "Onye nwere ike debịa",

    "explore.categoryLabel": "Ndị dụ",

    "explore.categoryNone": "O nweghị",
    "explore.public": "Ndị niile",
    "explore.friends": "Enyi",
    "explore.schoolOnly": "Ụlọ akwụkwọ naanị",
    "explore.everyone": "Ndị niile",
    "explore.nobody": "Onye ọbụla",

    "explore.giftsTipping": "Ego & Mpanị",

    "explore.allowed": "Ekwere",

    "explore.disabled": "Ekwepụtara",

    "explore.editPost": "Mee mgbanwe post",

    "explore.publishNow": "Buga Ugbu A",

    "explore.publishing": "Na-ebuga...",

    "explore.hdrActive": "HDR Na-arụ ọrụ",

    "explore.recordingPaused": "Ekwepụtara",

    "explore.recording": "Na-ekwu",

    "explore.permissionCameraTitle": "A Chọrọ Ikike",

    "explore.permissionCameraMsg": "A chọrọ ikike kyamera iji chụpụ foto na vidiyo.",

    "explore.permissionMicTitle": "A Chọrọ Ikike",

    "explore.permissionMicMsg": "A chọrọ ikike maịkri iji chụpụ vidiyo na ụda.",

    "explore.permissionGalleryTitle": "A Chọrọ Ikike",

    "explore.permissionGalleryMsg": "A chọrọ ikike iji banye na galari foto gị!",

    "explore.missingContentTitle": "Enweghị Ihe",

    "explore.missingContentMsg": "Biko tinye akụkọ na foto ole ma ọ bụ vidiyo.",

    "explore.missingCaptionTitle": "Enweghị Akụkọ",

    "explore.missingCaptionMsg": "Biko dere akụkọ maka post gị.",

    "explore.missingMediaTitle": "Enweghị Media",

    "explore.missingMediaMsg": "Biko tinye foto ma ọ bụ vidiyo.",

    "explore.publishSuccessTitle": "Ihe Ịmaebe",

    "explore.publishSuccessMsg": "Ebugara post gị!",

    "explore.publishErrorTitle": "Njehie Post",

    "explore.publishErrorMsg": "Enweghị ike chekwa post",

    "post.captionPlaceholder": "Kedu iha na-emehi?",

    "post.addHashtag": "Tinye hashtag...",

    "post.selectCategory": "Họrọ Ndị Dụ",

    "post.chooseAudience": "Họrọ Ndị Na-ege ntị",

    "post.whoCanComment": "Onye nwere ike debịa?",

    "post.audienceLabel": "Ndị Na-ege ntị",

    "post.whoCanCommentLabel": "Onye nwere ike debịa",

    "post.public": "Ndị niile",

    "post.followers": "Ndị Na-eso",

    "post.schoolOnly": "Ụlọ akwụkwọ naanị",

    "post.everyone": "Ndị niile",

    "post.nobody": "Onye ọbụla",

    "post.preview": "Nyocha",

    "post.campusLife": "Ndụ Kampas",

    "post.academics": "Mmụta",

    "post.sports": "Esports",

    "post.hostel": "Hostel",

    "post.marketplace": "Ahịa",

    "post.events": "Mgbanwe",

    "post.food": "Nri",

    "post.entertainment": "Ihe ịga azụ",

    "post.general": "Nchebe",

    "post.commentsLocked": "Ekwepụtara ndị na-ede",

    "post.commentsLockedDesc": "Onye nwebatisịrị ezigbo oke onye nwere ike hụ ma debịa na post a.",

    "post.reply": "Zaa aka azaa",

    "post.hideReplies": "Echekwabụrụ azaa",

    "post.viewReplies": "Hụ azaa {{count}}",

    "post.commentOptions": "Nhọrọ Ndị na-ede",

    "post.deleteComment": "Hichapụ Ndị na-ede",

    "post.reportComment": "Kọọ Ndị na-ede",

    "post.reportReasonTitle": "Kọọ Ndị na-ede",

    "post.reportReasonMsg": "Biko họrọ ihe kpatụrụ iji kọọ ndị na-ede a:",

    "post.selectReason": "Họrọ ihe kpatụrụ:",

    "post.cancel": "Kagbuo",

    "post.commentDeleted": "Echekwabụrụrụ ndị na-ede nke ọma.",

    "post.couldNotDeleteComment": "Enweghị ike hichapụ ndị na-ede. Biko nwaa ọzọ.",

    "post.thankYouReport": "Daalụ maka ikọọ ndị na-ede a.",

    "post.couldNotReportComment": "Enweghị ike zipụta nkọ. Biko nwaa ọzọ.",

    "post.couldNotPostComment": "Enweghị ike zipụta nkọ. Biko nwaa ọzọ.",

    "post.spamScam": "Spam ma ọ bụ Mmebi",

    "post.harassment": "Ị na-emebi ma ọ bụ Okwu Hate",

    "post.inappropriate": "Ihe na-adịghị mma",

    "post.other": "Ihe ọzọ",

    "hostel.coverBadge": "Mkpuchi",

    "hostel.addPhoto": "Tinye Foto",

    "hostel.photoLimitTitle": "Ogwu ezugara",

    "hostel.photoLimitMsg": "Ị nwere ike bulie foto 10 naanị.",

    "hostel.photoPermTitle": "A Chọrọ Ikike",

    "hostel.photoPermMsg": "Ị chọrọ nye ikike galari foto iji hụ foto.",

    "hostel.hostelNameLabel": "Aha Hostel",

    "hostel.hostelNamePlaceholder": "Sunshine Lodge",

    "hostel.descLabel": "Nkọwa",

    "hostel.descPlaceholder": "Kọkwara ndị nwa akwụkwọ gị banyere hostel gị...",

    "hostel.validationError": "Njehie Nnyocha",

    "hostel.photoRequired": "Biko bulie foto ole.",

    "hostel.nameRequired": "A chọrọ aha hostel.",

    "hostel.descRequired": "A chọrọ nkọwa.",

    "hostel.fillRequired": "Biko cyọ ngalaba niile a chọrọ.",

    "hostel.next": "N'ihu",

    "hostel.roomTypeLabel": "Ụdị Uwe",

    "hostel.genderLabel": "Nkwetụta",

    "hostel.male": "Nwoke",

    "hostel.female": "Nwanyị",

    "hostel.mixed": "Njikọta",

    "hostel.maxOccupants": "Oke ndị na-eyi",

    "hostel.totalRooms": "Uwe niile",

    "hostel.availableRoomsLabel": "Uwe dị",

    "hostel.availabilityLabel": "Ịdị",

    "hostel.availableNow": "Dị ugbu a",

    "hostel.nextMonth": "Mberụ na-abịa",

    "hostel.comingSoon": "Na-abịa",

    "hostel.lookingRoommate": "Ị na-achọ onye ọbụrụbe?",

    "hostel.seekingRoommate": "Ekenye gị ga-egosi na ị na-achọ onye ọbụrụbe",

    "hostel.selfOnly": "Ị na-ekebe ebe a maka gị naanị",

    "hostel.wifi": "Wi-Fi",

    "hostel.electricity247": "Ike Elektrik 24/7",

    "hostel.runningWater": "Mmiri",

    "hostel.security": "Nchebe",

    "hostel.cctv": "CCTV",

    "hostel.parking": "Ebe Ụkwụ",

    "hostel.laundry": "Ahụ Ọkù",

    "hostel.kitchen": "Ebe Nri",

    "hostel.wardrobe": "Ebe Akpụkpọ Ọkù",

    "hostel.studyArea": "Ebe Mmụta",

    "hostel.generator": "Jenereita",

    "hostel.fullyFurnished": "Echekwabụrụrụ niile",

    "hostel.airConditioner": "Ebugharị Ikpe",

    "hostel.balcony": "Balkoni",

    "hostel.smartTv": "Smart TV",

    "hostel.contactPersonLabel": "Onye Nkwetụta",

    "hostel.contactPersonPlaceholder": "John Doe",

    "hostel.phoneLabel": "Nọmba Ekentị",

    "hostel.phonePlaceholder": "+234 801 234 5678",

    "hostel.whatsappLabel": "Nọmba WhatsApp",

    "hostel.emailLabel": "Adreesị Email",

    "hostel.emailPlaceholder": "hostel@email.com",

    "hostel.officeAddressLabel": "Adreesị Ofisi (Nhọrọ)",

    "hostel.officeAddressPlaceholder": "12 Ugbowo Road",

    "hostel.contactHoursLabel": "Ehihie Nkwetụta",

    "hostel.contactHoursPlaceholder": "8:00 AM - 6:00 PM",

    "hostel.preferredContact": "Ụzọ Nkwetụta ọdọchị",

    "hostel.previewLocation": "Ebe",

    "hostel.previewNear": "Nso {{school}}",

    "hostel.previewMonthlyRent": "Ego ọnwa",

    "hostel.previewServiceCharge": "Ego Ọrụ:",

    "hostel.previewCautionFee": "Ego Nchebe:",

    "hostel.previewTotal": "Niile:",

    "hostel.previewRoomDetails": "Nkọwa Uwe",

    "hostel.previewRoomType": "Ụdị: {{type}}",

    "hostel.previewGender": "Nkwetụta: {{gender}}",

    "hostel.previewCapacity": "Oke: {{count}} Onye",

    "hostel.previewAvailableRooms": "Uwe Dị: {{count}}",

    "hostel.previewAmenities": "Ihe Ndị Na-adị",

    "hostel.previewRules": "Usoro",

    "hostel.previewCurfew": "Nchebe: {{value}}",

    "hostel.previewVisitors": "Ndị ọbịa: {{value}}",

    "hostel.previewPets": "Anụ ọhịa: {{value}}",

    "hostel.previewSmoking": "Ị na-epu stick: {{value}}",

    "hostel.allowed": "Ekwere",

    "hostel.notAllowed": "Ekwepụtara",

    "hostel.none": "O nweghị",

    "hostel.publishHostel": "Buga Hostel",

    "hostel.publishing": "Na-ebuga...",

    "hostel.publishSuccess": "Ezigara ndabere ụlọ gị nye admin maka nkwado ma ọ ga-apụta mgbe akwadoro ya.",

    "hostel.publishError": "Ihe mgbechi.",

    "hostel.publishSuccessTitle": "Ezigara Maka Nyocha",

    "hostel.publishErrorTitle": "Njehie",

    "feedCard.more": "Ụzọ",

    "feedCard.less": "Ike",

    "feedCard.editCaption": "Mee mgbanwe nkọwa",

    "feedCard.editHashtags": "Mee mgbanwe hashtags",

    "feedCard.changeCategory": "Mgbanwe Ndị Dụ",

    "feedCard.changePermission": "Mgbanwe Ikike",

    "feedCard.giftSettings": "Nhazi Ego",

    "feedCard.playbackSpeed": "Ọsọ Ntughari",

    "feedCard.playbackSpeedTitle": "Ọsọ Ntughari",

    "feedCard.playbackSpeedHint": "Họrọ ọsọ nke vidiyo a.",

    "feedCard.hideFromFeed": "Echekwabụrụ na feed",

    "feedCard.reportPost": "Kọọ Post",

    "feedCard.deletePermanently": "Hichapụ mgbe niile",

    "feedCard.editCaptionTitle": "Mee mgbanwe nkọwa",

    "feedCard.writeContext": "Dee nkọwa ebe a...",

    "feedCard.back": "Azụ",

    "feedCard.save": "Chekwa",

    "feedCard.editHashtagsTitle": "Mee mgbanwe hashtags",

    "feedCard.hashtagHint": "Kewasịa tags na ntabi. Ọ dịghị ike anya pịa '#'.",

    "feedCard.editCategoryTitle": "Mee mgbanwe Ndị Dụ",

    "feedCard.editCategoryHint": "Nyekwakọ ndị gị aka ị chọta post gị site na okwu.",

    "feedCard.adjustPrivacy": "Tinye nchebe na ikike",

    "feedCard.giftSettingsTitle": "Nhazi Ego",

    "feedCard.giftSettingsHint": "Nye nhazi ego maka ihe a.",

    "feedCard.receiveAwards": "Nata Ụkwọ Ego",

    "feedCard.receiveAwardsHint": "Kweka ego dijital na ego na post a",

    "feedCard.savePreference": "Chekwa Ntụzị aka",

    "feedCard.reportTitle": "Kọọ Post",

    "feedCard.reportHint": "Biko kọkọrọ anyị ihe kpatụrụ ikọọ post a. Nkọ gị dị n'ezie.",

    "feedCard.reportReasonPlaceholder": "Dee ihe kpatụrụ gị ebe a...",

    "feedCard.submitReport": "Zipụta Nkọ",

    "feedCard.hideConfirmTitle": "Echekwabụrụ post a?",

    "feedCard.hideConfirmMsg": "Ị ga-ahụ post a ọzọ na feed gị.",

    "feedCard.hidePost": "Echekwabụrụ Post",

    "feedCard.deleteConfirmTitle": "Hichapụ post a?",

    "feedCard.deleteConfirmMsg": "Ị na-ejikọta nke ọma? Ihe a ga-adị mgbe niile.",

    "feedCard.delete": "Hichapụ",

    "feedCard.cancel": "Kagbuo",

    "feedCard.update": "Mee mgbanwe",

    "feedCard.captionUpdated": "Emeere mgbanwe nkọwa nke ọma.",

    "feedCard.hashtagsUpdated": "Emeere mgbanwe hashtags nke ọma.",

    "feedCard.categorySaved": "Echekwabụrụrụ Ndị Dụ nke ọma.",

    "feedCard.privacyUpdated": "Emeere mgbanwe nchebe nke ọma.",

    "feedCard.giftPrefsApplied": "Etinyere nhazi ego.",

    "feedCard.postReported": "Ekọọrụrụ post nke ọma.",

    "feedCard.postHidden": "Echekwabụrụrụ post na feed.",

    "feedCard.postDeleted": "Echekwabụrụrụ post nke ọma.",

    "feedCard.followError": "Enweghị ike mgbanwe ọnọdụ na-eso",

    "feedCard.reshareError": "Enweghị ike mezuo post ọzọ. Biko nwaa ọzọ.",

    "feedCard.favoritesError": "Enweghị ike mgbanwe ihe ọna-choo.",

    "feedCard.giftFailed": "Enweghị ike rute ego.",

    "feedCard.giftForbidden": "Ekwepụtara Ego",

    "giftSwitch.title": "Nnabata Ego",

    "giftSwitch.subtitle": "Ka ndị mmadụ rute ego dijitalụ na post a",

    "stories.yourStory": "Nkịrị gị",

    "stories.storyPublished": "Ekbugarala nkịrị!",

    "stories.storyPublishedMsg": "Nkịrị gị dị ebe a ma ga-efu n'ime awa 24.",

    "stories.storyError": "Ihe mgbechi hapụrụ mgbe a na-enye nkịrị gị.",

    "createPost.placeholder": "Kedu iha na-emehi na kampas gị?",
    "createPost.title": "Mee Post Ọhụrụ",
    "createPost.preview": "Nyocha",

    "post.replyingTo": "Na-ezere {{name}}",

    "post.writeComment": "Dee ndi na-ede...",

    "post.writeReply": "Dee azaa...",

    "post.viewReply": "Hụ azaa {{count}}",

    "post.tagPeople": "Tag Ndi Mmadu",

    "hostel.addressLabel": "Adreesi",

    "hostel.addressPlaceholder": "12 Ugbowo Road",

    "hostel.cityLabel": "City",

    "hostel.cityPlaceholder": "Benin City",

    "hostel.stateLabel": "Steeti",

    "hostel.statePlaceholder": "Edo",

    "hostel.pricingLabel": "Ego Afia",

    "hostel.pricingPlaceholder": "250000",

    "hostel.serviceChargeLabel": "Ego Ozu",

    "hostel.serviceChargePlaceholder": "20000",

    "hostel.cautionFeeLabel": "Ego Nchebe",

    "hostel.cautionFeePlaceholder": "15000",

    "hostel.totalCost": "Ego Niile",

    "hostel.rulesTitle": "Usoro & Usoro",

    "hostel.rulesSubtitle": "Kokwara ndi nwa akwukwo ihe ga-esi na ya bu n'ihu ya",

    "hostel.visitorsAllowed": "Enwerela ndi oya",

    "hostel.visitorsAllowedDesc": "Ndi nwa akwukwo nwere ike nata ndi oya.",

    "hostel.smokingAllowedRule": "Enwerela stick",

    "hostel.smokingAllowedDesc": "E kwere stick.",

    "hostel.petsAllowedRule": "Enwerela anu",

    "hostel.petsAllowedDesc": "Ndi nwa akwukwo nwere ike ji anu.",

    "hostel.generatorAvailable": "Dị Jenereita",

    "hostel.generatorAvailableDesc": "A na-enye ike elektrik nzukko.",

    "hostel.curfewTime": "Ehihie Nchebe",

    "hostel.curfewPlaceholder": "10:00 PM",

    "hostel.additionalRulesLabel": "Usoro ndi ozo",

    "hostel.additionalRulesPlaceholder": "Enwegi egwu oku",

  // ── Materials / Academic ─────────────────────────────────────
  "materials.title": "Akụrụngwa Mmụta",
  "materials.subtitle": "Ajụjụ gara aga, na akwụkwọ na eji mee",
  "materials.browseCategory": "Chọgharịa site na Udi",
  "materials.pastQuestionsCount": "Ajụjụ 1000+",
  "materials.lectureNotes": "Akụkwọ Ndụ",
  "materials.lectureNotesFormat": "PDF, DOC & Slides",
  "materials.textbooks": "Akụkwọ",
  "materials.textbooksDesc": "Akụkwọ a na-aba n'ụzọ",
  "materials.projectTopics": "Isi Ntopic Projects",
  "materials.projectTopicsDesc": "Mmụta Research",
  "materials.assignments": "Omume",
  "materials.assignmentsDesc": "Eme ka & Tasks",
  "materials.practicals": "Mgbanwe",
  "materials.practicalsDesc": "Akụkwọ Laboratory",
  "materials.pastQuestions": "Ajụjụ Gara Aga",
  "materials.notes": "Akụkwọ Ndụ",
  "materials.upload": "Bulie akụrụngwa",

  // ── Marketplace ──────────────────────────────────────────────
  "marketplace.title": "Ahịa",
  "marketplace.sell": "Rē",
  "marketplace.buy": "Rịa",
  "marketplace.noItems": "Ihe adịghị ahụ",
  "marketplace.subtitle": "Rịa, na ahịa na ọrụ na ndị niley",
  "marketplace.searchPlaceholder": "Chọọ ihe, ahịa...",
  "marketplace.postMessage": "Degharịa Ihe",
  "marketplace.price": "Ugo",
  "marketplace.negotiable": "Nwere ike ikparịta",

  // ── Events ───────────────────────────────────────────────────
  "events.title": "Ihe Omume",
  "events.subtitle": "Ihe omume a na-adịbeghị anya, ọrụ aka & nzukọ campus",

  // ── Jobs ─────────────────────────────────────────────────────
  "jobs.title": "Ọrụ & Intership",
  "jobs.subtitle": "Ihe omume ọrụ, ọrụ òké & ọrụ ụmụ akwụkwọ",
  "jobs.searchPlaceholder": "Chọọ ọrụ, ụlọ ọrụ...",

  // ── Wallet / Coins ───────────────────────────────────────────
  "wallet.title": "Akpụkpọ ego",
  "wallet.balance": "Ego",
  "wallet.coins": "Ego",
  "wallet.transactions": "Azụmahịa",
  "wallet.earn": "Weta Ego",
  "wallet.spend": "Jiri Ego",
  "wallet.dailyFree": "Eke nke Ehieme",

  // ── Home / Feed ──────────────────────────────────────────────
  "home.title": "Ụlọ",

  // ── Search ───────────────────────────────────────────────────
  "search.title": "Chọọ Ndị Mma",
  "search.subtitle": "Chọọ ndị mmadụ, akwụkwọ, ma ọ bụ akwụkwọ",
  "search.noResults": "A chọtara azịza",
  "search.searchPlaceholder": "Chọọ...",
  "search.showingResults": "Na-egosi azịza maka \"{{query}}\"",
  "search.noResultsFound": "A chọtara ndị ọkụkwọ ọ bụrụ na ha jikọtara na \"{{query}}\"",
  "search.recentSearches": "Chọọ nke na-adịbeghị anya ({{count}})",
  "search.clearAll": "Hichapụ niile",
  "search.noRecentSearches": "Ọ bụghị nchọta nke na-adịbeghị anya ka",
  "search.suggestedStudents": "Ndị ọkụkwọ a提议",
  "search.noSuggestedStudents": "A chọtara ndị ọkụkwọ a提议",
  "search.trendingStudents": "Ndị ọkụkwọ na-eto eto",
  "search.noTrendingStudents": "A chọtara ndị ọkụkwọ na-eto eto",
  "search.follow": "Soro",
  "search.following": "Na-eso",

  // ── Followers ────────────────────────────────────────────────
  "followers.title": "Ndị na-eso",
  "followers.following": "Na-eso",
  "followers.noFollowers": "Adịghị ndị na-eso taa",
  "followers.noFollowing": "Adịghị esi onye ọbụla",
  "followers.couldNotLoad": "Enweghị ike bulie",
  "followers.couldNotUpdate": "Enweghị ike emelite ọnọdụ esi",

  // ── Change Password ──────────────────────────────────────────
  "password.title": "Gbanwee Paswọọdụ",
  "password.subtitle": "Emelite paswọọdụ akawnt gị",
  "password.currentPassword": "Paswọọdụ Ugbu a",
  "password.newPassword": "Paswọọdụ Ọhụrụ",
  "password.confirmNewPassword": "Nyochaa Paswọọdụ Ọhụrụ",
  "password.currentPlaceholder": "Tinye paswọọdụ ugbu a",
  "password.newPlaceholder": "Tinye paswọọdụ ọhụrụ",
  "password.confirmPlaceholder": "Nyochaa paswọọdụ ọhụrụ",
  "password.updateButton": "Emelite Paswọọdụ",
  "password.updatedSuccess": "Emeliteela paswọọdụ nke ọma",
  "password.couldNotUpdate": "Enweghị ike emelite paswọọdụ",
  "password.fieldsRequired": "Biko zuru oké akụkụ niile",
  "password.noMatch": "Paswọọdụ adịghị otu",
  "password.tooShort": "Paswọọdụ kwesịrị ịbụ ọkachasị mkpụrụ okwu 8",

  // ── Edit Profile ─────────────────────────────────────────────
  "editProfile.title": "Gbanwee Profaịlụ",
  "editProfile.firstName": "Aha mbụ",
  "editProfile.lastName": "Aha ikpeazụ",
  "editProfile.username": "Aha ọrụ",
  "editProfile.bio": "Bayani",
  "editProfile.school": "Akwụkwọ",
  "editProfile.department": "Akụkụ",
  "editProfile.level": "Ogo",
  "editProfile.phoneNumber": "Namba ekwentị",
  "editProfile.saveChanges": "Chekwaa Gbanwee",
  "editProfile.profileUpdated": "Emeliteela profaịlụ nke ọma",
  "editProfile.couldNotUpdate": "Enweghị ike emelite profaịlụ",
  "editProfile.changePhoto": "Gbanwee Foto",
  "editProfile.takePhoto": "Nweta Foto",
  "editProfile.chooseFromLibrary": "Họpụta Site n'Ụlọ Akwụkwọ",
  "editProfile.cancel": "Kagbuo",

  // ── Account Action ───────────────────────────────────────────
  "account.deactivate": "Kagbuo Akawnt",
  "account.delete": "Hichapụ Akawnt",
  "account.deactivateTitle": "Kagbuo Akawnt?",
  "account.deleteTitle": "Hichapụ Akawnt?",
  "account.deactivateConfirm": "Ị nwere nchebe na ị chọrọ ikagbuo akawnt gị? Ị nwere ike ịkwụnye ya ọzọ n'azụ.",
  "account.deleteConfirm": "Ị nwere nchebe na ị chọrọ ihichapụ akawnt gị? Omume a abụghị nke a ga-ewegharịa.",
  "account.cannotBeUndone": "Omume a abụghị nke a ga-ewegharịa.",
  "account.deactivateButton": "Kagbuo Akawnt M",
  "account.deleteButton": "Hichapụ Akawnt M",
  "account.deactivatedSuccess": "Akawnt ekagbuela",
  "account.deletedSuccess": "Akawnt ehichapụla",

  // ── Storage & Cache ──────────────────────────────────────────
  "storage.title": "Nchekwa na Cache",
  "storage.subtitle": "Jikwaa data cache",
  "storage.imageCache": "Cache Mgbasa Ozi",
  "storage.imageCacheDesc": "Foto profaịlụ na media nchekwara",
  "storage.videoCache": "Cache Veedio",
  "storage.videoCacheDesc": "Akụkwọ mmega ahụ a na-adọwnloads ugbu a",
  "storage.thumbnailCache": "Cache Ntụaka",
  "storage.thumbnailCacheDesc": "Mgbasa ozi veedio mmepụta",
  "storage.messageCache": "Cache Ozi",
  "storage.messageCacheDesc": "Ozi mkparịta ụka adịghị na net",
  "storage.clearAll": "Hichapụ Cache Niile",
  "storage.clearAllConfirm": "Ị nwere nchebe na ị chọrọ ihichapụ data cache niile?",
  "storage.cacheCleared": "Ehichapụrụ cache nke ọma",
  "storage.cleared": "Ehichapụla",

  // ── Report Problem ───────────────────────────────────────────
  "report.title": "Kọọ Nsogbu",
  "report.subtitle": "Zụrụ anyị ihe na-emeka",
  "report.description": "Nkọwa",
  "report.descriptionPlaceholder": "Zụrụ anyị ihe mere...",
  "report.submitReport": "Nye Kọọ",
  "report.submitting": "Na-enye...",
  "report.success": "Ekọọrụla nke ọma",
  "report.couldNotSubmit": "Enweghị ike inye kọọ",
  "report.descriptionRequired": "Biko kọwaazịrị nsogbu ahụ",

  // ── Levels / Leaderboard ─────────────────────────────────────
  "levels.title": "Ogo",
  "levels.yourLevel": "Ogo Gị",
  "levels.nextLevel": "Ogo Acchara",
  "levels.pointsToNext": "Points {{points}} gaa n'ihu ogo acchara",
  "leaderboard.title": "Azụmahịa",
  "leaderboard.subtitle": "Azụmahịa & omume na-arụ ọrụ",
  "leaderboard.thisWeek": "Izu a",
  "leaderboard.allTime": "Oge niile",
  "leaderboard.rank": "Azụmahịa",
  "leaderboard.points": "Point",

  // ── Story ────────────────────────────────────────────────────
  "story.viewStory": "Lee Akụkọ",

  // ── Two-Factor Auth ──────────────────────────────────────────
  "twofa.title": "Nnyocha Abụọ",
  "twofa.enable": "Kunna 2FA",
  "twofa.disable": "Kagbuo 2FA",
  "twofa.enterCode": "Tinye koodu nyocha",
  "twofa.codeSent": "Ekwerela koodu nyocha",
  "twofa.couldNotSend": "Enweghị ike iziga koodu nyocha.",
  "twofa.enabled": "Ekunna 2FA nke ọma",
  "twofa.disabled": "Ekagbụrụ 2FA nke ọma",
  "twofa.invalidCode": "Koodu nyocha adịghị mma",

  // ── Waveform Settings ────────────────────────────────────────
  "waveform.headerTitle": "Waveform Ọrụ Olu",
  "waveform.shape": "USORO",
  "waveform.barCount": "Ọnụnọ Bar",
  "waveform.barCountDesc": "Oke bar ndị dị na waveform",
  "waveform.barCountFormat": "bar {{count}}",
  "waveform.barWidth": "Obosara Bar",
  "waveform.barWidthDesc": "Obosara nke kọọtara bar",
  "waveform.barWidthFormat": "{{count}}px",
  "waveform.barGap": "Njikọta Bar",
  "waveform.barGapDesc": "Njikọta dị n'etiti bar",
  "waveform.barGapFormat": "{{count}}px",
  "waveform.maxHeight": "Ntakịrị Nzọụkwụ",
  "waveform.maxHeightDesc": "Ntakịrị nke bar kachasị elu",
  "waveform.maxHeightFormat": "{{count}}px",
  "waveform.color": "COLOR",
  "waveform.trackOpacity": "Opacity Track",
  "waveform.trackOpacityDesc": "Bar ndị adịghị akwụsị dị otu a ga-ahụ",
  "waveform.trackOpacityFormat": "{{count}}%",
  "waveform.playedBarColor": "Color Bar Echepụtala",
  "waveform.playedBarColorDesc": "Na-efu automatic — kraa ịhụnwa ọ bụla",
  "waveform.auto": "Automatic",
  "waveform.autoMatchesBubble": "Automatic (na-efu bubble)",
  "waveform.animation": "Mgbawa",
  "waveform.pulseSpeed": "Speed Pulse",
  "waveform.pulseSpeedDesc": "Oge nke bar pulse otu",
  "waveform.pulseSpeedFormat": "{{count}}ms",
  "waveform.waveSpeed": "Speed Wave",
  "waveform.waveSpeedDesc": "Njikọta dị n'etiti bar — ntakịrị na-efegharị ngwa ngwa",
  "waveform.waveSpeedFormat": "{{count}}ms",
  "waveform.pulseDepth": "Depth Pulse",
  "waveform.pulseDepthDesc": "Oke bar na-apagharị mgbe na-arụ ọrụ",
  "waveform.pulseDepthFormat": "{{count}}%",
  "waveform.resetDefaults": "Tọgharia Nyocha",
  "waveform.preview": "Lee N'ozuzu",
  "waveform.settingsRestored": "Echekwabụla ntọala waveform ka returned na default",
  "waveform.saved": "Echekwabụla ntọala",

  // ── Errors ───────────────────────────────────────────────────
  "error.generic": "Ihe nwere ike ime. Biko nwaa ọzọ.",
  "error.network": "Enweghị njikọta ịntanetị. Biko nyochaa nkwụọ ụkwụ gị.",
  "error.unauthorized": "Oge gị agwụla. Biko banye ọzọ.",
  "error.notFound": "Ihe ị na-achọ adịghị.",
  "error.permission": "Ị nweghị ikike ime ya.",
  "error.couldNotSend": "Enweghị ike iziga. Biko nwaa ọzọ.",
  "error.couldNotLoad": "Enweghị ike bulie data. Biko nwaa ọzọ.",
  "error.couldNotDelete": "Enweghị ike hichapụ. Biko nwaa ọzọ.",
  "error.couldNotSave": "Enweghị ike chekwaa. Biko nwaa ọzọ.",
  "error.permissionDenied": "Ikike Ekwughị",
  "error.error": "Nsogbu",

  // ── Success ──────────────────────────────────────────────────
  "success.saved": "Echekwabụla nke ọma",
  "success.sent": "Ezigabụla nke ọma",
  "success.deleted": "Ehichapụbụla nke ọma",
  "success.updated": "Egbanwebụrụ nke ọma",
  "success.copied": "Edetubụrụ n'ime clipbọọdụ",
  "success.success": "Ihe ọma",

  // ── Misc ─────────────────────────────────────────────────────
  "misc.today": "Taa",
  "misc.yesterday": "Ụnya",
  "misc.thisWeek": "Izu a",
  "misc.older": "Nke gara aga",
  "misc.justNow": "Taa nke ọma",
  "misc.minutesAgo": "{{count}} nkeji gara aga",
  "misc.hoursAgo": "{{count}}awa gara aga",
  "misc.daysAgo": "{{count}} Ụbọchị gara aga",
  "misc.giftReceived": "Eke ana-egosipụta 🎁",
  "misc.giftSent": "{{name}} ziri gị eke!",
  "misc.levelUp": "Ị ga-agbaso nzọụkwụ!",
  "misc.newFollower": "{{name}} bido esi gị",
  "misc.comingSoon": "Ga-abịa na ego",
  "misc.noResults": "A chọtara azịza",
  "misc.pullToRefresh": "Ruo ka ọhụrụ",
  "misc.cancel": "Kagbuo",
  "misc.tryAgain": "Nwaa ọzọ",

  // ── Quick Actions ────────────────────────────────────────────
  "quickactions.title": "Omume Ngwa Ngwa",
  "quickactions.leaderboard": "Azụmahịa",
  "quickactions.marketplace": "Ahịa",
  "quickactions.hostels": "Ụlọ",
  "quickactions.events": "Ihe Omume",
  "quickactions.groups": "Ndị Ụmụ",
  "quickactions.achievement": "Ihe ị ga-ahụ",
  "quickactions.jobs": "Ọrụ",
  "quickactions.notes": "Akụkwọ M",
  "quickactions.games": "Egwuregwu",
  "quickactions.aiTutor": "Onye nkuzi AI",
  "quickactions.elections": "Ntuli aka",
  "ai.title": "Onye Nkwado AI",
  "ai.subtitle": "Mmekọrịta & Enyemaka ngwa ngwa",
  "ai.newChat": "Mmekọrịta Ohuru",
  "ai.heroTitle": "Onye Nkwado AI",
  "ai.heroSubtitle": "Enyi gị amamihe dọlọrọ ajụjọ ọ bụla ọrụ.",
  "ai.heroGreeting": "Ndewo! Kedu ka m ga-enyere aka gị taa?",
  "ai.recentChats": "Mmekọrịta Nnọchite",
  "ai.noChats": "Enweghị mmekọrịta ncheta. Bido mmekọrịta ohuru!",
  "ai.untitledChat": "Mmekọrịta Enweghị Aha",
  "ai.tapToContinue": "Pịa iji gaa n'ihu mmekọrịta",
  "ai.listening": "Anaghi ekwu... (Pịa mic iji kwụsị)",
  "ai.askAnything": "Rịọ ajụjọ ọ bụla...",
  "ai.deleteChat": "Hichapụ Mmekọrịta",
  "ai.deleteChatConfirm": "Ị nwere ikeji na ị chọrọ ihichapụ mmekọrịta a?",
  "ai.couldNotDelete": "Enweghị ike ihichapụ mmekọrịta. Biko nwaa ọzọ.",
  "ai.permissionCamera": "A chọrọ ikike n'ime galleri foto!",
  "ai.permissionMic": "A chọrọ ikike microphone.",
  "ai.errorSending": "Njeha Ihe Nzuzo",
  "ai.failedProcess": "Azụahịa azụ adịghị. Biko nwaa ọzọ.",
  "ai.noResponse": "Enweghị zaghachi e chuara.",
  "comingSoon.badge": "NA-AFIKỌ IRI",
  "comingSoon.title": "Ihe ọhụrụ\ndị egwu ga-abịa!",
  "comingSoon.subtitle": "Anyị na-arụ ọrụ siri ike inye gị\nahụmịhe ohuru na isi.",
  "comingSoon.stayTuned": "Nọrọ na-eche!",
  "comingSoon.newFeatures": "Atụmatụ Ohuru",
  "comingSoon.newFeaturesDesc": "Ngwa ngwa aka na-enyere gị aka ka mma",
  "comingSoon.betterExperience": "Ahụmịhe Kachasị Mma",
  "comingSoon.betterExperienceDesc": "Ọ dị mfe, ọ sọ oke ọsọ ma ọ bụ amamihe",
  "comingSoon.excitingRewards": "Ego Na-akpali Obi",
  "comingSoon.excitingRewardsDesc": "Ọzọ ego ga-abịa gị n'ebe",
  "comingSoon.ctaTitle": "Bụrụ onye mbụ ị maara!",
  "comingSoon.ctaSubtitle": "Anyị ga-akọrịta gị ozugbo anyị malitere.",
  "comingSoon.notifyMe": "Kọrịta M",
  "comingSoon.notified": "E Kọrịtala!",
  "comingSoon.goBack": "Laghachi Obodo",
  "comingSoon.onTheList": "Ị nọ na ntọala!",
  "comingSoon.willNotify": "Anyị ga-akọrịta gị ozugbo anyị malitere.",
  "jobs.detailTitle": "Nkọwa Ọrụ",
  "jobs.detailSubtitle": "Ihe mkpọsa, usoro nyocha ọrụ na ndepụta",
  "jobs.loadingDetails": "Na-agbajịrị nkọwa...",
  "jobs.notFound": "Ọrụ Adịghị",
  "jobs.notFoundDesc": "A dekọrọ ọrụ a n'oge gara aga",
  "jobs.description": "Nkọwa",
  "jobs.requirements": "Ihe A Chọrọ",
  "jobs.benefits": "Ụba",
  "jobs.applicants": "ndị na-arịọ",
  "jobs.viewManage": "Leba ma jikwaa ndị na-arịọ",
  "jobs.applyNow": "Rịọ Ugbu A",
  "jobs.applyTo": "Rịọ a {{company}}",
  "jobs.coverLetterHint": "Dee akwụkwọ nnọchite dị egwu",
  "jobs.coverLetterPlaceholder": "Onye nleta ọrụ, m na-enyo...",
  "jobs.submitApplication": "Nye Akwụkwọ",
  "jobs.applications": "Ndeko Ọrụ",
  "jobs.deleteJob": "Hichapụ Ọrụ",
  "jobs.deleteConfirm": "Ị nwere ikeji na ị chọrọ ihichapụ dekọrọ ọrụ a?",
  "jobs.applicationSent": "Ezinyere dekọrọ!",
  "jobs.applicationSubmitted": "E nyochala dekọrọ gị.",
  "jobs.statusUpdated": "Emeela ntọala ọhụrụ",
  "jobs.jobDeleted": "Ehichapụrụ ọrụ",
  "jobs.failedToLoad": "Njeha ibuli nkọwa ọrụ",
  "jobs.failedToApply": "Njeha irịọ ọrụ",
  "jobs.failedToLoadApps": "Njeha ibuli ndeko ọrụ",
  "jobs.failedToUpdate": "Njeha itinye ọhụrụ",
  "jobs.failedToDelete": "Njeha ihichapụ ọrụ",
  "jobs.pleaseWriteCover": "Biko dee akwụkwọ nnọchite",
  "jobs.loadingApplications": "Na-agbajịrị ndeko ọrụ...",
  "jobs.noApplications": "Enweghị ndeko ọrụ",
  "notes.title": "Ntọala",
  "notes.subtitle": "Ngwa nkuzi, ndepụta nkuzi & nduzi kwụkwọrịta",
  "notes.allNotes": "Ntọala Niile",
  "notes.classes": "Klas",
  "notes.personal": "Nke Gi",
  "notes.bookmarks": "Akara",
  "notes.searchPlaceholder": "Chọọ ntọala...",
  "notes.pinned": "Akara ({{count}})",
  "notes.recentNotes": "Ntọala Nnọchite",
  "notes.noNotes": "Enweghị ntọala",
  "notes.newNote": "Ntọala Ohuru",
  "notes.editNote": "Dee Ntọala",
  "notes.category": "Ụdị",
  "notes.noteTitle": "Aha Ntọala",
  "notes.noteContent": "Bido itinye ntọala nkuzi gị ebe a...",
  "notes.general": "Nke Niile",
  "notes.missingFields": "Biko tinye aha na nkọwa.",
  "notes.failedToFetch": "Njeha inweta ntọala sitere n'igwe.",
  "notes.failedToRefresh": "Njehi itinye ọhụrụ ntọala.",
  "notes.failedToSave": "Njehi ibuli ntọala n'igwe.",
  "notes.failedToPin": "Njehi itinye ọhụrụ ọnọdụ pin.",
  "notes.failedToBookmark": "Njehi itinye ọhụrụ ọnọdụ akara.",
  "notes.failedToDelete": "Njehi ihichapụ ntọala.",
  "notes.deleteNote": "Hichapụ Ntọala",
  "notes.deleteConfirm": "Ị nwere ikeji na ị chọrọ ihichapụ ntọala a?",
  "pastQ.uploadTitle": "Bulie Ajụjọ Gara Aga",
  "pastQ.uploadSubtitle": "Nyere enyi gị aka inweta",
  "pastQ.tips": "Ndụmọdụ Bulie",
  "pastQ.verifiedOnly": "Dịka ndị nwatakọrịrị chọtara n'ụlọ akwụkwọ",
  "pastQ.verifiedDesc": "Ajụjọ gara aga nọ na ndị nwatakọrịrị n'ụlọ akwụkwọ gị na ụdị dị n'ime ya.",
  "pastQ.academicDetails": "Nkọwa Akwụkwọ",
  "pastQ.academicDetailsHint": "Jikwaa na nkọwa a zuru oke ka ndị ọzọ chọta nkesa gị.",
  "pastQ.level": "Ọkwa",
  "pastQ.selectLevel": "Họpụta Ọkwa",
  "pastQ.courseCode": "Koodu Klas",
  "pastQ.courseCodePlaceholder": "dịka CSC 312",
  "pastQ.courseTitle": "Aha Klas / Isiokwu",
  "pastQ.courseTitlePlaceholder": "dịka Data Structures & Algorithms",
  "pastQ.academicSession": "Ọbịrịa Akwụkwọ",
  "pastQ.selectSession": "Họpụta Ọbịrịa",
  "pastQ.examSemester": "Ọbịrịa Nnyocha",
  "pastQ.uploadFiles": "Bulie Faịlụ",
  "pastQ.uploadFilesHint": "Bulie faịlụ doro anya. Ị nwere ike ibuliọtụ faịlụ.",
  "pastQ.tapToUpload": "Pịa iji bulie faịlụ",
  "pastQ.fileFormats": "JPG, PNG ruo n'ikpeazụ 10MB maka ọ bụla",
  "pastQ.addMore": "Mee ka ọzọ",
  "pastQ.disclaimerTitle": "Biko jikwaa:",
  "pastQ.disclaimerBullet1": "Ajụjọ na-apụta n'ụlọ akwụkwọ gị.",
  "pastQ.disclaimerBullet2": "Nkesa a pụghị ịdị okike ga-efu gị oge.",
  "pastQ.uploading": "Na-abuliọtụ...",
  "pastQ.uploadButton": "Bulie Ajụjọ Gara Aga",
  "pastQ.onlyInstitution": "Ndị nwatakọrịrị n'ụlọ akwụkwọ gị n'ike na-enwe ike ịhụ ihe a.",
  "pastQ.selectOption": "Họpụta {{type}}",
  "pastQ.uploadSuccess": "Ebuliri ajụjọ gị nke ọma.",
  "pastQ.uploadSuccessful": "Nkesa Nke Ọma",
  "searchResults.all": "Niile",
  "searchResults.people": "Ndị Mmadụ",
  "searchResults.schools": "Ụlọ Akwụkwọ",
  "searchResults.courses": "Klas",
  "searchResults.unknownSchool": "Ụlọ Akwụkwọ Amaghị",
  "searchResults.unknownDept": "Ụdị Amaghị",
  "searchResults.student": "Nwatakọrịrị",
  "verification.title": "Nnyocha Nwatakọrịrị",
  "verification.subtitle": "Nyee aka inyocha ahụmịhe akwụkwọ gị",
  "verification.studentId": "Kaatị Nwatakọrịrị",
  "verification.admissionLetter": "Akwụkwọ Mbata",
  "verification.uploadId": "Bulie Kaatị Nwatakọrịrị",
  "verification.uploadLetter": "Bulie Akwụkwọ Mbata",
  "verification.confirmDocs": "Anyị na-akwado na akwụkwọ a bụ nke m",
  "verification.submit": "Nye Nnyocha",
  "verification.submitting": "Na-enye ozi...",
  "verification.successMsg": "E nyochala akwụkwọ gị. Nnyocha na-adịbeghị anya na-ewere naanị awa 24.",
  "verification.successTitle": "Amaliteola Nnyocha",
  "verification.uploadAtLeast": "Biko bulie akwụkwọ otu ọnụ.",
  "verification.confirmDocuments": "Biko jikwaa na akwụkwọ a bụ nke gị.",
  "twofaVerify.title": "Nyocha Ahụ",
  "twofaVerify.subtitle": "Tinye koodu e zigara na ngwa gị",
  "twofaVerify.verify": "Nyochaa",
  "twofaVerify.resend": "Ruo ọzọ Koodu",
  "twofaVerify.codeSent": "Ezigarala koodu ọhụrụ",
  "twofaVerify.invalidCode": "Koodu a pụghị ịdị okike. Biko nwaa ọzọ.",
  "twofaVerify.verified": "Emelala nyocha ahụ nke ọma",
  "pastQ.failedToLoad": "Njeha inweta ajụjọ gara aga.",
  "pastQ.noDownloadLink": "Enweghị njikọta bulie faịlụ a.",
};

export default ig;

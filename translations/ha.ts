// translations/ha.ts
// Hausa

import type { TranslationKey } from "./en";

const ha: Partial<Record<TranslationKey, string>> = {
  // ── Navigation / Tabs ────────────────────────────────────────
  "tab.home": "Gida",
  "tab.explore": "Bincika",
  "tab.messages": "Saƙonni",
  "tab.following": "Ana Bi",
  "tab.materials": "Kayan Aiki",
  "tab.profile": "Bayanan Martaba",

  // ── Common Actions ───────────────────────────────────────────
  "action.back": "Baya",
  "action.done": "An gama",
  "action.cancel": "Soke",
  "action.save": "Ajiye",
  "action.delete": "Share",
  "action.edit": "Gyara",
  "action.send": "Aika",
  "action.confirm": "Tabbatar",
  "action.yes": "Eh",
  "action.no": "A'a",
  "action.close": "Rufe",
  "action.retry": "Sake gwadawa",
  "action.submit": "Tura",
  "action.next": "Gaba",
  "action.previous": "Baya",
  "action.apply": "Amfani",
  "action.search": "Bincika",
  "action.loading": "Ana lodawa...",
  "action.refresh": "Sabunta",
  "action.share": "Raba",
  "action.copy": "Kwafi",
  "action.viewAll": "Duba Duka",
  "action.seeMore": "Duba Ƙari",
  "action.seeLess": "Duba Ƙanƙanin",
  "action.learnMore": "Koyi Ƙari",
  "action.submitting": "Ana tura...",
  "action.deactivate": "Soke",

  // ── Auth ─────────────────────────────────────────────────────
  "auth.login": "Shiga",
  "auth.signup": "Yi Rajista",
  "auth.logout": "Fita",
  "auth.forgotPassword": "An manta Kalmar Sirri?",
  "auth.resetPassword": "Sake Saita Kalmar Sirri",
  "auth.enterEmail": "Shigar da adireshin imel ɗinka",
  "auth.enterPassword": "Shigar da kalmar sirrinka",
  "auth.confirmPassword": "Tabbatar da kalmar sirrinka",
  "auth.email": "Imel",
  "auth.password": "Kalmar Sirri",
  "auth.fullName": "Cikakken Suna",
  "auth.username": "Sunan Amfani",
  "auth.phone": "Lambar Waya",
  "auth.noAccount": "Ba ku da asusu?",
  "auth.hasAccount": "Kuna da asusu?",
  "auth.continueWithGoogle": "Ci gaba da Google",

  // ── Profile ──────────────────────────────────────────────────
  "profile.title": "Bayanan Martaba",
  "profile.editProfile": "Gyara Bayanan Martaba",
  "profile.followers": "Masu Bi",
  "profile.following": "Ana Bi",
  "profile.posts": "Bayanan Bugu",
  "profile.follow": "Bi",
  "profile.unfollow": "Daina Bi",
  "profile.followingYou": "Yana Bi Ku",
  "profile.block": "Rufe",
  "profile.unblock": "Buɗe",
  "profile.report": "Rahoto",
  "profile.message": "Saƙi",
  "profile.shareProfile": "Raba Bayanan Martaba",
  "profile.manageAccount": "Gudanar da komai game da asusunku",
  "profile.account": "ASUSU",
  "profile.activity": "AIKI",
  "profile.studentVerification": "Tabbatar da Dalibi",
  "profile.verifyIdentity": "Tabbatar da identity na makarantar ka",
  "profile.achievements": "Nasarori",
  "profile.likes": "Suna So",
  "profile.gifts": "Abubuwan Kayan Aiki",
  "profile.anonymousStudent": "Dalibi Maras Suna",
  "profile.tabPosts": "Bayanan Bugu",
  "profile.tabReshares": "Sake Rabawa",
  "profile.tabDrafts": "Takardu Na Gaba",
  "profile.tabHidden": "Da Ke Boye",
  "profile.tabSaved": "Da Ke Ajiye",
  "profile.tabTagged": "Da Aka Tag",
  "profile.noContent": "Babu Abubuwa",
  "profile.emptyTab": "Ba a sami {{tab}} ba",

  // ── Settings ─────────────────────────────────────────────────
  "settings.title": "Saituna",
  "settings.notifications": "Sanarwa",
  "settings.privacySecurity": "Sirri da Tsaro",
  "settings.language": "Harshe",
  "settings.appearance": "Bayyanar",
  "settings.dark": "Duhu",
  "settings.light": "Haske",
  "settings.storageCache": "Ajiye da Kwas",
  "settings.helpSupport": "Taimako da Tallafi",
  "settings.reportProblem": "Rahoto Matsala",
  "settings.blockedUsers": "Masu Rufe",
  "settings.accountAction": "Asusu",
  "settings.deactivateAccount": "Soke Asusu",
  "settings.deleteAccount": "Share Asusu",
  "settings.onlineStatus": "Yanayin Kan Yanar Gizo",
  "settings.readReceipts": "Tabbatar Da Karantawa",
  "settings.activityStatus": "Yanayin Aiki",
  "settings.marketplace": "Kasuwanci",
  "settings.hostel": "Hotela",
  "settings.leaderboard": "Matsayi & Mataki",
  "settings.general": "Gabaɗaya",
  "settings.soundEnabled": "Sauti",
  "settings.waveform": "Sautin Saƙi",
  "settings.waveformDesc": "Daidaita bayyanar saƙi",
  "settings.manageCachedData": "Gudanar da bayanan ajiye",

  // ── Language ─────────────────────────────────────────────────
  "language.title": "Harshe",
  "language.select": "ZABAR HARSHEN KU",
  "language.updated": "An Sabunta Harshe",
  "language.setTo": "An saita harshe zuwa {{language}}",
  "language.footer":
    "Harshen app zai sabunta a duk tantaunyoyin. Wasu abubuwan cikin sauran masu amfani na iya kasancewa a harshen asalin su.",

  // ── Messages / Chat ──────────────────────────────────────────
  "chat.title": "Saƙonni",
  "chat.subtitle": "Ku hada da manyan dalibi",
  "chat.searchPlaceholder": "Bincika saƙonni...",
  "chat.noMessages": "Ba a saƙonni ba tukuna",
  "chat.startConversation": "Fara hirar",
  "chat.typeMessage": "Rubuta saƙi...",
  "chat.updateMessage": "Sabunta saƙi...",
  "chat.loading": "Buɗe tattaunawa...",
  "chat.send": "Aika",
  "chat.online": "Yana Kan Yanar Gizo",
  "chat.offline": "Ba Ya Kan Yanar Gizo",
  "chat.typing": "Yana rubutawa...",
  "chat.leftTheChat": "{{name}} ya bar tattaunawa",
  "chat.joinedTheChat": "{{name}} ya shiga tattaunawa",
  "chat.sentGift": "{{name}} ya aika {{gift}} x{{count}}",
  "chat.pinnedMessage": "Saƙi mai ƙulle",
  "chat.unpinMessage": "Cire ƙulle",
  "chat.replyTo": "Amsa wa {{name}}",
  "chat.jumpToMessage": "Tafi zuwa saƙi",
  "chat.messageNotInView": "Saƙi ba a ganin shi ba",
  "chat.messageNotLoaded": "Saƙin asali ba a lodawa a wannan tattaunawar ba.",
  "chat.deleteMessage": "Share Saƙi",
  "chat.editMessage": "Gyara Saƙi",
  "chat.copyMessage": "Kwafi",
  "chat.replyMessage": "Amsa",
  "chat.pinMessage": "Ƙulle Saƙi",
  "chat.deleteConfirmTitle": "Share wannan saƙi?",
  "chat.deleteConfirmBody": "Ba za a iya soke wannan aikin ba.",
  "chat.messageUpdated": "An sabunta saƙi",
  "chat.messageDeleted": "An share saƙi",
  "chat.couldNotDeleteMessage": "Ba za a iya share saƙi ba",
  "chat.couldNotSendVoiceNote": "Ba za a iya aika saƙin murya ba",
  "chat.couldNotStartRecording": "Ba za a iya fara rikodin ba",
  "chat.couldNotStopRecording": "Ba za a iya dakin rikodin ba",
  "chat.permissionMediaRequired": "Ana buƙatar izinin tafiya zuwa ɗakin ajiyar multimedia.",
  "chat.permissionMicRequired": "Ana buƙatar izinin wayar don rikodin saƙonni na murya.",
  "chat.connectionFailed": "Haɗin Ya Gaza",
  "chat.showingSavedMessages": "Ba a kan yanar gizo — ana nuna saƙonninku da aka ajiye.",
  "chat.chatError": "Kuskuren Tattaunawa",
  "chat.couldNotStart": "Ba za a iya fara tattaunawar ba.",
  "chat.couldNotSendGift": "Ba za a iya aika kyauta ba",
  "chat.notificationsMuted": "Sanarwa Ta Cire Murya",
  "chat.notificationsUnmuted": "Sanarwa Ta Sake Murya",
  "chat.chatBubbleUpdated": "An sabunta bubble na tattaunawa",
  "chat.couldNotSyncBubble": "Ba za a iya haɗa salon bubble ba",
  "chat.actionFailed": "Aikin Ya Gaza",
  "chat.deleteChat": "Share Tattaunawa",
  "chat.deleteChatConfirm": "Share wannan tattaunawar?",
  "chat.deleteChatBody": "Duk saƙonnin zasu share har abada.",
  "chat.chatDeleted": "An Share Tattaunawa",
  "chat.couldNotDeleteChat": "Ba za a iya share tattaunawar ba",
  "chat.customizeBubble": "Saita Bubble",
  "chat.chatBackground": "Bayanin Tattaunawa",
  "chat.sharedMedia": "Daular da aka Raba",
  "chat.viewProfile": "Duba Bayanan Martaba",
  "chat.mute": "Cire Murya",
  "chat.unmute": "Sake Murya",
  "chat.pinChat": "Ƙulle Tattaunawa",
  "chat.unpinChat": "Cire Ƙullen Tattaunawa",
  "chat.searchMembers": "Bincika members...",
  "chat.left": "ya bar",
  "chat.joined": "ya shiga",
  "chat.pinned": "ya ƙulle",
  "chat.unpinned": "ya cire ƙulle",
  "chat.addReaction": "Ƙara amsa",
  "chat.reply": "Amsa",
  "chat.replyToMessage": "Amsa wa {{name}}",
  "chat.cancelReply": "Soke amsa",
  "chat.gallery": "Fakitin Hotuna",
  "chat.document": "Ɗakin Ajiya",
  "chat.recordVoice": "Rikodi Murya",
  "chat.stopRecording": "Dakatar da Rikodi",
  "chat.cancelRecording": "Soke",
  "chat.sendVoice": "Aika",
  "chat.listenVoice": "Saurara",
  "chat.deleteVoice": "Share",
  "chat.messagePlaceholder": "Saƙi",
  "chat.updatePlaceholder": "Sabunta saƙi...",
  "chat.typePlaceholder": "Rubuta saƙi...",
  "group.searchMembers": "Bincika members...",
  "group.searchDefault": "Bincika karkara na tsoho...",
  "group.searchMy": "Bincika karkaran na...",

  // ── Posts / Feed ─────────────────────────────────────────────
  "post.like": "So",
  "post.unlike": "Ba a So",
  "post.comment": "Ra'ayi",
  "post.comments": "Ra'ayi",
  "post.share": "Raba",
  "post.delete": "Share Bayani",
  "post.edit": "Gyara Bayani",
  "post.report": "Rahoto Bayani",
  "post.noPosts": "Ba a bayani ba tukuna",
  "post.writeSomething": "Rubuta wani abu...",
  "post.likedBy": "An so ta {{name}}",
  "post.commentsCount": "ra'ayi {{count}}",
  "post.loadingFeed": "Ana lodawa feed ɗinka…",
  "post.noPostsInTab": "Babu bayani a {{tab}}",
  "post.beTheFirst": "Ku zama na farko wanda zai buga ko ku dawo nan gaba.",
  "post.refreshFeed": "Sabunta Feed",
  "post.sharedToFeed": "An raba bayani zuwa feed ɗinka",
  "post.couldNotShare": "Ba za a iya raba wannan bayanin ba yanzu.",
  "post.reportedSuccess": "An rahoto bayani cikin nasara",
  "post.couldNotReport": "Ba za a iya rahoto wannan bayanin ba yanzu.",
  "post.deletedSuccess": "An share bayani cikin nasara",
  "post.commentsTitle": "Ra'ayi",
  "post.noComments": "Babu ra'ayi tukuna. Ku zama na farko!",
  "post.addComment": "Ƙara ra'ayi...",

  // ── Groups ───────────────────────────────────────────────────
  "group.title": "Karkara",
  "group.create": "Ƙirƙiri Karkara",
  "group.join": "Shiga Karkara",
  "group.leave": "Bar Karkara",
  "group.members": "Mambers",
  "group.member": "Mamber",
  "group.name": "Sunan Karkara",
  "group.description": "Bayani",
  "group.noGroups": "Ba a karkara ba tukuna",
  "group.searchPlaceholder": "Bincika karkara...",
  "group.online": "{{count}} kan yanar gizo",

  // ── Notifications ────────────────────────────────────────────
  "notifications.title": "Sanarwa",
  "notifications.noNotifications": "Ba a sanarwa ba tukuna",
  "notifications.markAllRead": "Yi alama cikin duka",
  "notifications.settings": "Saituna na Sanarwa",

  // ── Explore ──────────────────────────────────────────────────
  "explore.title": "Bincika",
  "explore.searchPlaceholder": "Bincika kampas...",
  "explore.trending": "Yana Yawo",
  "explore.latest": "Na Ƙarshe",
  "explore.forYou": "Don Ku",
  "explore.searchTagUser": "Bincika wani amfani don tag",
  "explore.searchTagMode": "Bincika {{mode}} don tag",

    "explore.tagPeople": "Ƙara Sunayen",

    "explore.followers": "Masu Bi",

    "explore.following": "Bi Ko",

    "explore.selected": "{{count}} an zaɓi",

    "explore.typeToSearch": "Rubuta don nema wani mutum.",

    "explore.noUsersToTag": "Babu {{mode}} don ƙara.",

    "explore.postPreview": "Duba Bayani",

    "explore.feedPreview": "Duba Bayani",

    "explore.privacyDistribution": "Sirri & Rarraba",

    "explore.whoCanSee": "Wanne zai iya ganin wannan bayani",

    "explore.whoCanComment": "Wanne zai iya rubuta",

    "explore.categoryLabel": "Nau'i",

    "explore.categoryNone": "Babu",
    "explore.public": "Jamaa",
    "explore.friends": "Abokai",
    "explore.schoolOnly": "Makarantar kaɗai",
    "explore.everyone": "Kowa",
    "explore.nobody": "Babu wani",

    "explore.giftsTipping": "Abubuwan Kayan Aiki & Ladi",

    "explore.allowed": "An yarda",

    "explore.disabled": "An soke",

    "explore.editPost": "Gyara Bayani",

    "explore.publishNow": "Bugawa Yanzu",

    "explore.publishing": "Ana Bugawa...",

    "explore.hdrActive": "HDR YANA AIKI",

    "explore.recordingPaused": "AN DAKKANA",

    "explore.recording": "NA RIKITA",

    "explore.permissionCameraTitle": "Ana Buƙatar Izini",

    "explore.permissionCameraMsg": "Ana buƙatar samun damar kyamara don ɗaukar hotuna da bidiyo.",

    "explore.permissionMicTitle": "Ana Buƙatar Izini",

    "explore.permissionMicMsg": "Ana buƙatar samun damar makiro don ɗaukar bidiyo tare da sauti.",

    "explore.permissionGalleryTitle": "Ana Buƙatar Izini",

    "explore.permissionGalleryMsg": "Ana buƙatar izinin samun damar hotunan.gallery ɗinka!",

    "explore.missingContentTitle": "Babu Abubuwa",

    "explore.missingContentMsg": "Da fatan za a ƙara rubutu da hotuna ko bidiyo.",

    "explore.missingCaptionTitle": "Babu Rubutu",

    "explore.missingCaptionMsg": "Da fatan za a rubuta rubutu don bayanin ka.",

    "explore.missingMediaTitle": "Babu Media",

    "explore.missingMediaMsg": "Da fatan za a ƙara hotuna ko bidiyo.",

    "explore.publishSuccessTitle": "Nasara",

    "explore.publishSuccessMsg": "An buga bayanin ka!",

    "explore.publishErrorTitle": "Kuskuren Bugawa",

    "explore.publishErrorMsg": "Ba za a iya ajiye bayanin ba",

    "post.captionPlaceholder": "Me ke faruwa?",

    "post.addHashtag": "Ƙara hashtag...",

    "post.selectCategory": "Zaɓi Nau'i",

    "post.chooseAudience": "Zaɓi Masu Sauraro",

    "post.whoCanComment": "Wanne zai iya rubuta?",

    "post.audienceLabel": "Masu Sauraro",

    "post.whoCanCommentLabel": "Wanne zai iya rubuta",

    "post.public": "Jamaa",

    "post.followers": "Masu Bi",

    "post.schoolOnly": "Makarantar kaɗai",

    "post.everyone": "Kowa",

    "post.nobody": "Babu wani",

    "post.preview": "Duba",

    "post.campusLife": "Rayuwar Campus",

    "post.academics": "Ilimi",

    "post.sports": "Wasan",

    "post.hostel": "Makarantar Shade",

    "post.marketplace": "Makarantar Kasuwa",

    "post.events": "Abubuwan da ke faruwa",

    "post.food": "Abinci",

    "post.entertainment": "Nuni",

    "post.general": "Gaba ɗaya",

    "post.commentsLocked": "An soke sharhi",

    "post.commentsLockedDesc": "Mawuyacin ya iyakanta ko wane zai iya ganin kuma barin bayanin kan a kan wannan bayanin.",

    "post.reply": "Amsa",

    "post.hideReplies": "Boyeye amsoshi",

    "post.viewReplies": "Duba amsoshi {{count}}",

    "post.commentOptions": "Zaɓukan sharhi",

    "post.deleteComment": "Cire sharhi",

    "post.reportComment": "Bayar da sharhi",

    "post.reportReasonTitle": "Bayar da sharhi",

    "post.reportReasonMsg": "Da fatan za a zaɓi dalili don bayar da wannan sharhi:",

    "post.selectReason": "Zaɓi dalili:",

    "post.cancel": "Soke",

    "post.commentDeleted": "An cire sharhi cikin nasara.",

    "post.couldNotDeleteComment": "Ba za a iya cire sharhi ba. Da fatan za a sake gwadawa.",

    "post.thankYouReport": "Na gode da bayar da wannan sharhi.",

    "post.couldNotReportComment": "Ba za a iya aika bayar ba. Da fatan za a sake gwadawa.",

    "post.couldNotPostComment": "Ba za a iya aika sharhi ba. Da fatan za a sake gwadawa.",

    "post.spamScam": "Spam ko Ƙoshin Kwarai",

    "post.harassment": "Ciwace ko Maganar Juriya",

    "post.inappropriate": "Abubuwa maras Kyau",

    "post.other": "Wani abu",

    "hostel.coverBadge": "Magana",

    "hostel.addPhoto": "Ƙara Hotuna",

    "hostel.photoLimitTitle": "E Zarce",

    "hostel.photoLimitMsg": "Za a iya loda hotuna goma kawai.",

    "hostel.photoPermTitle": "Ana Buƙatar Izini",

    "hostel.photoPermMsg": "Do ne ma ba da damar gallery dinka don zaɓar hotuna.",

    "hostel.hostelNameLabel": "Sunan Makarantar Shade",

    "hostel.hostelNamePlaceholder": "Sunshine Lodge",

    "hostel.descLabel": "Bayani",

    "hostel.descPlaceholder": "Gaya wa dalibai kan akan makarantar shade ɗinka...",

    "hostel.validationError": "Kuskuren Tabbatarwa",

    "hostel.photoRequired": "Da fatan za a loda hotuna kaɗai.",

    "hostel.nameRequired": "Ana buƙatar sunan makarantar shade.",

    "hostel.descRequired": "Ana buƙatar bayani.",

    "hostel.fillRequired": "Da fatan za a cika dukkan filayen da ake bukata.",

    "hostel.next": "Gaba",

    "hostel.roomTypeLabel": "Nau'in Daki",

    "hostel.genderLabel": "Jinsi",

    "hostel.male": "Namiji",

    "hostel.female": "Mace",

    "hostel.mixed": "Haɗaɗɗe",

    "hostel.maxOccupants": "Mafi yawan masu zama",

    "hostel.totalRooms": "Jimlar Dakuna",

    "hostel.availableRoomsLabel": "Dakuna da ke shirye",

    "hostel.availabilityLabel": "Shirye",

    "hostel.availableNow": "Yanzu tana shirye",

    "hostel.nextMonth": "Wata mai zuwa",

    "hostel.comingSoon": "Tana zo",

    "hostel.lookingRoommate": "Kana neman roommate?",

    "hostel.seekingRoommate": "Bayanin ka zai nuna cewa kana neman roommate",

    "hostel.selfOnly": "Kana kiran wannan yana don kanka kaɗai",

    "hostel.wifi": "Wi-Fi",

    "hostel.electricity247": "Wutar Lantarki 24/7",

    "hostel.runningWater": "Ruwan Sanya",

    "hostel.security": "Tsaro",

    "hostel.cctv": "CCTV",

    "hostel.parking": "Garage",

    "hostel.laundry": "Fenta",

    "hostel.kitchen": "Daftar Cin Abinci",

    "hostel.wardrobe": "Tufafin",

    "hostel.studyArea": "Yankin Ilimi",

    "hostel.generator": "Jenereta",

    "hostel.fullyFurnished": "An cika shigar da shigar",

    "hostel.airConditioner": "Na'urar Sanyaya",

    "hostel.balcony": "Balkon",

    "hostel.smartTv": "Smart TV",

    "hostel.contactPersonLabel": "Mutumin Tuntuɓi",

    "hostel.contactPersonPlaceholder": "John Doe",

    "hostel.phoneLabel": "Lambar Waya",

    "hostel.phonePlaceholder": "+234 801 234 5678",

    "hostel.whatsappLabel": "Lambar WhatsApp",

    "hostel.emailLabel": "Adireshin Imel",

    "hostel.emailPlaceholder": "hostel@email.com",

    "hostel.officeAddressLabel": "Adireshin Ofis (Zaɓi ne)",

    "hostel.officeAddressPlaceholder": "12 Ugbowo Road",

    "hostel.contactHoursLabel": "Lokacin Tuntuɓi",

    "hostel.contactHoursPlaceholder": "8:00 AM - 6:00 PM",

    "hostel.preferredContact": "Hanyar Tuntuɓi da aka fi so",

    "hostel.previewLocation": " wurin",

    "hostel.previewNear": "Kusa da {{school}}",

    "hostel.previewMonthlyRent": "Kira na wata",

    "hostel.previewServiceCharge": "Kudin Sabis:",

    "hostel.previewCautionFee": "Asusu:",

    "hostel.previewTotal": "Jimla:",

    "hostel.previewRoomDetails": "Cikakken Bayanin Daki",

    "hostel.previewRoomType": "Nau'in: {{type}}",

    "hostel.previewGender": "Jinsi: {{gender}}",

    "hostel.previewCapacity": "Iko: {{count}} Mutum(mai)",

    "hostel.previewAvailableRooms": "Dakuna da ke shirye: {{count}}",

    "hostel.previewAmenities": "Abubuwan Ciki",

    "hostel.previewRules": "Doka",

    "hostel.previewCurfew": "Dakon dare: {{value}}",

    "hostel.previewVisitors": "Manyan Kuɗa: {{value}}",

    "hostel.previewPets": "Kunama: {{value}}",

    "hostel.previewSmoking": "Siga: {{value}}",

    "hostel.allowed": "An yarda",

    "hostel.notAllowed": "Ba a yarda ba",

    "hostel.none": "Babu",

    "hostel.publishHostel": "Bugawa Makarantar Shade",

    "hostel.publishing": "Ana Bugawa...",

    "hostel.publishSuccess": "An aika sanarwar masaukin ku ga admin don tantancewa kuma za ta bayyana bayan an amince da ita.",

    "hostel.publishError": "Wani abu ya lallasa.",

    "hostel.publishSuccessTitle": "An Aika Don Dubawa",

    "hostel.publishErrorTitle": "Kuskure",

    "feedCard.more": "Ƙari",

    "feedCard.less": "Ƙanƙanta",

    "feedCard.editCaption": "Gyara Bayani",

    "feedCard.editHashtags": "Gyara Hashtags",

    "feedCard.changeCategory": "Canza Nau'i",

    "feedCard.changePermission": "Canza Izini",

    "feedCard.giftSettings": "Saitunan Kayan Aiki",

    "feedCard.playbackSpeed": "Guduwar Bidiyo",

    "feedCard.playbackSpeedTitle": "Guduwar Bidiyo",

    "feedCard.playbackSpeedHint": "Zaɓi gudun da wannan bidiyo zai gudana.",

    "feedCard.hideFromFeed": "Boye daga Bayani",

    "feedCard.reportPost": "Bayar da Bayani",

    "feedCard.deletePermanently": "Cire Har Abada",

    "feedCard.editCaptionTitle": "Gyara Bayani",

    "feedCard.writeContext": "Rubuta bayani a nan...",

    "feedCard.back": "Baya",

    "feedCard.save": "Ajiye",

    "feedCard.editHashtagsTitle": "Gyara Hashtags",

    "feedCard.hashtagHint": "Raba tages tare da wurare. Babu buƙatar rubuta '#'.",

    "feedCard.editCategoryTitle": "Gyara Nau'i",

    "feedCard.editCategoryHint": "Taimaka wa abokanku su sami bayanin ka ta mawƙi.",

    "feedCard.adjustPrivacy": "Daidaita Sirri da Izini",

    "feedCard.giftSettingsTitle": "Saitunan Kayan Aiki",

    "feedCard.giftSettingsHint": "Sarrafa saitunan kuɗa ga wannan abun ciki.",

    "feedCard.receiveAwards": "Sami Lada da Kayan Aiki",

    "feedCard.receiveAwardsHint": "Ba da damar tokens na dijital da kayan aiki a wannan bayanin",

    "feedCard.savePreference": "Ajiye Zabe",

    "feedCard.reportTitle": "Bayar da Bayani",

    "feedCard.reportHint": "Da fatan za a sanar da mu dalilin da kuke bayar da wannan bayanin. Bayarinku yana da sirri.",

    "feedCard.reportReasonPlaceholder": "Rubuta dalilin ka nan...",

    "feedCard.submitReport": "Aika Bayar",

    "feedCard.hideConfirmTitle": "Boyeyi wannan bayani?",

    "feedCard.hideConfirmMsg": "Za ku sake ganin wannan bayani a bayanin ku.",

    "feedCard.hidePost": "Boyeyi Bayani",

    "feedCard.deleteConfirmTitle": "Cire wannan bayani?",

    "feedCard.deleteConfirmMsg": "Ka tabbata cikakke? Wannan aiki har abada ne.",

    "feedCard.delete": "Cire",

    "feedCard.cancel": "Soke",

    "feedCard.update": "Sabunta",

    "feedCard.captionUpdated": "An gyara bayani cikin nasara.",

    "feedCard.hashtagsUpdated": "An gyara hashtags cikin nasara.",

    "feedCard.categorySaved": "An ajiye nau'i cikin nasara.",

    "feedCard.privacyUpdated": "An sabunta sirri cikin nasara.",

    "feedCard.giftPrefsApplied": "An aika saitunan kayan aiki.",

    "feedCard.postReported": "An buga bayani cikin nasara.",

    "feedCard.postHidden": "An boye bayani daga bayani.",

    "feedCard.postDeleted": "An cire bayani cikin nasara.",

    "feedCard.followError": "Ba za a iya sabunta halin bi ba",

    "feedCard.reshareError": "Ba za a iya sake raba bayani ba. Da fatan za a sake gwadawa.",

    "feedCard.favoritesError": "Ba za a iya sabunta abin da suke so ba.",

    "feedCard.giftFailed": "Ba a iya isar da kayan aiki ba.",

    "feedCard.giftForbidden": "An hana Kayan Aiki",

    "giftSwitch.title": "Sami Kayan Aiki",

    "giftSwitch.subtitle": "Bar mutane su aika kayan aiki na dijital a wannan bayanin",

    "stories.yourStory": "Labarinka",

    "stories.storyPublished": "An buga Labari!",

    "stories.storyPublishedMsg": "Labarinka yana nan kuma za su ɓace cikin awanni 24.",

    "stories.storyError": "Wani abu ya lallasa lokacin raba labarinka.",

    "createPost.placeholder": "Me ke faruwa a kan kaɗan ka?",
    "createPost.title": "Ƙirƙiri Bayani",
    "createPost.preview": "Duba Bayani",

    "post.replyingTo": "Ana amsa wa {{name}}",

    "post.writeComment": "Rubuta sharhi...",

    "post.writeReply": "Rubuta amsa...",

    "post.viewReply": "Duba amsa {{count}}",

    "post.tagPeople": "Kaŕa Sunayen",

    "hostel.addressLabel": "Adireshi",

    "hostel.addressPlaceholder": "12 Ugbowo Road",

    "hostel.cityLabel": "Birni",

    "hostel.cityPlaceholder": "Benin City",

    "hostel.stateLabel": "Jihar",

    "hostel.statePlaceholder": "Edo",

    "hostel.pricingLabel": "Kira na shekera",

    "hostel.pricingPlaceholder": "250000",

    "hostel.serviceChargeLabel": "Kudin Sabis",

    "hostel.serviceChargePlaceholder": "20000",

    "hostel.cautionFeeLabel": "Asusu",

    "hostel.cautionFeePlaceholder": "15000",

    "hostel.totalCost": "Jimlar Kuɗi",

    "hostel.rulesTitle": "Doka & Manufa",

    "hostel.rulesSubtitle": "Gaya wa dalibai abin da za su samu kafin brakwa.",

    "hostel.visitorsAllowed": "An yarda masu ziyara",

    "hostel.visitorsAllowedDesc": "Dalibai za su iya karbi masu ziyara.",

    "hostel.smokingAllowedRule": "An yarda sigar",

    "hostel.smokingAllowedDesc": "An yarda da sigar.",

    "hostel.petsAllowedRule": "An yarda kunama",

    "hostel.petsAllowedDesc": "Dalibai za su iya kiyi kunama.",

    "hostel.generatorAvailable": "Ana samun Jenereta",

    "hostel.generatorAvailableDesc": "Ana samun wutar lantarki ta madawwai.",

    "hostel.curfewTime": "Lokacin Dakon dare",

    "hostel.curfewPlaceholder": "10:00 PM",

    "hostel.additionalRulesLabel": "Karin Doka",

    "hostel.additionalRulesPlaceholder": "Babu wakar brawa bayan 10PM...",

  // ── Materials / Academic ─────────────────────────────────────
  "materials.title": "Kayayyakin Ilimi",
  "materials.subtitle": "Tambayoyin da suka wuce, bayanan darasi da kayan karatu",
  "materials.browseCategory": "Duba ta fuska",
  "materials.pastQuestionsCount": "Tambayoyi 1000+",
  "materials.lectureNotes": "Bayanan Darasi",
  "materials.lectureNotesFormat": "PDF, DOC & Slides",
  "materials.textbooks": "Kwalekwale",
  "materials.textbooksDesc": "Litattafan da ake ba da shawara",
  "materials.projectTopics": "Batutuwan Project",
  "materials.projectTopicsDesc": "Ra'ayoyin bincike",
  "materials.assignments": "Ayyuka",
  "materials.assignmentsDesc": "Ayyuka & Shiryawa",
  "materials.practicals": "Ayyukan Tafkin",
  "materials.practicalsDesc": "Jagororin Tafkin",
  "materials.pastQuestions": "Tambayoyin da Suka Wuce",
  "materials.notes": "Bayanan Darasi",
  "materials.upload": "Bulky kayan aiki",

  // ── Marketplace ──────────────────────────────────────────────
  "marketplace.title": "Kasuwanci",
  "marketplace.sell": "Sayar",
  "marketplace.buy": "Saya",
  "marketplace.noItems": "Ba a abubuwa ba tukuna",
  "marketplace.subtitle": "Sayaya, sayar da & mamaye da dalibi",
  "marketplace.searchPlaceholder": "Bincika kayayyaki, alamomi...",
  "marketplace.postMessage": "Buga Abun",
  "marketplace.price": "Farashi",
  "marketplace.negotiable": "Za a iya yin rama",

  // ── Events ───────────────────────────────────────────────────
  "events.title": "Abubuwan da ke faruwa",
  "events.subtitle": "Ayyukan da ke zo, ayyukan aiki & tarurrukan campus",

  // ── Jobs ─────────────────────────────────────────────────────
  "jobs.title": "Ayyuka & Internship",
  "jobs.subtitle": "Damuwar aiki, matsayin farawa & ayyukan dalibi",
  "jobs.searchPlaceholder": "Bincika ayyuka, kamfanoni...",

  // ── Wallet / Coins ───────────────────────────────────────────
  "wallet.title": "Jakar Kuɗi",
  "wallet.balance": "Ma'aunin",
  "wallet.coins": "Kuɗi",
  "wallet.transactions": "Ayyuka",
  "wallet.earn": "Samun Kuɗi",
  "wallet.spend": "Amfani da Kuɗi",
  "wallet.dailyFree": "Kyautar Yau da Wata",

  // ── Home / Feed ──────────────────────────────────────────────
  "home.title": "Gida",

  // ── Search ───────────────────────────────────────────────────
  "search.title": "Neman Manyan Dalibi",
  "search.subtitle": "Bincika mutane, makarantu, ko karatu",
  "search.noResults": "Ba a samu sakamako ba",
  "search.searchPlaceholder": "Bincika...",
  "search.showingResults": "Nuna sakamako ga \"{{query}}\"",
  "search.noResultsFound": "Ba a sami dalibai da suka dace da \"{{query}}\" ba",
  "search.recentSearches": "Bincikan da suka wuce ({{count}})",
  "search.clearAll": "Share duka",
  "search.noRecentSearches": "Ba a sami bincikan da suka wuce ba tukuna",
  "search.suggestedStudents": "Dalibai da aka ba da shawara",
  "search.noSuggestedStudents": "Ba a sami dalibai da aka ba da shawara ba",
  "search.trendingStudents": "Dalibai masu yawo",
  "search.noTrendingStudents": "Ba a sami dalibai masu yawo ba",
  "search.follow": "Bi",
  "search.following": "Ana Bi",

  // ── Followers ────────────────────────────────────────────────
  "followers.title": "Masu Bi",
  "followers.following": "Ana Bi",
  "followers.noFollowers": "Babu masu bi tukuna",
  "followers.noFollowing": "Ba a bi ko wanne dan mutum ba",
  "followers.couldNotLoad": "Ba za a iya lodawa ba",
  "followers.couldNotUpdate": "Ba za a iya sabunta yanayin biyan ba",

  // ── Change Password ──────────────────────────────────────────
  "password.title": "Canza Kalmar Sirri",
  "password.subtitle": "Sabunta kalmar sirrin asusunku",
  "password.currentPassword": "Kalmar Sirri ta Yanzu",
  "password.newPassword": "Sabuwar Kalmar Sirri",
  "password.confirmNewPassword": "Tabbatar da Sabuwar Kalmar Sirri",
  "password.currentPlaceholder": "Shigar da kalmar sirrin yanzu",
  "password.newPlaceholder": "Shigar da sabuwar kalmar sirri",
  "password.confirmPlaceholder": "Tabbatar da sabuwar kalmar sirri",
  "password.updateButton": "Sabunta Kalmar Sirri",
  "password.updatedSuccess": "An sabunta kalmar sirri cikin nasara",
  "password.couldNotUpdate": "Ba za a iya sabunta kalmar sirri ba",
  "password.fieldsRequired": "Da fatan za a cika dukkan fakitin",
  "password.noMatch": "Kalmar sirri ba su daidaita ba",
  "password.tooShort": "Kalmar sirri dole ta kasance aƙalla 8 haruffa",

  // ── Edit Profile ─────────────────────────────────────────────
  "editProfile.title": "Gyara Bayanan Martaba",
  "editProfile.firstName": "Sunan Farko",
  "editProfile.lastName": "Sunan Ƙarshe",
  "editProfile.username": "Sunan Amfani",
  "editProfile.bio": "Bayani",
  "editProfile.school": "Makaranta",
  "editProfile.department": "Sashen",
  "editProfile.level": "Mataki",
  "editProfile.phoneNumber": "Lambar Waya",
  "editProfile.saveChanges": "Ajiye Canje-canje",
  "editProfile.profileUpdated": "An sabunta bayanan martaba cikin nasara",
  "editProfile.couldNotUpdate": "Ba za a iya sabunta bayanan martaba ba",
  "editProfile.changePhoto": "Canza Hoto",
  "editProfile.takePhoto": "Ɗauki Hoto",
  "editProfile.chooseFromLibrary": "Zaɓa Daga Ɗakin Ajiya",
  "editProfile.cancel": "Soke",

  // ── Account Action ───────────────────────────────────────────
  "account.deactivate": "Soke Asusu",
  "account.delete": "Share Asusu",
  "account.deactivateTitle": "Soke Asusu?",
  "account.deleteTitle": "Share Asusu?",
  "account.deactivateConfirm": "Kuna da tabbacin kuna son soke asusunku? Za ku iya sake kunsa daga baya.",
  "account.deleteConfirm": "Kuna da tabbacin kuna son share asusunku? Ba za a iya soke wannan aikin ba.",
  "account.cannotBeUndone": "Ba za a iya soke wannan aikin ba.",
  "account.deactivateButton": "Soke Asusuna",
  "account.deleteButton": "Share Asusuna",
  "account.deactivatedSuccess": "An soke asusu",
  "account.deletedSuccess": "An share asusu",

  // ── Storage & Cache ──────────────────────────────────────────
  "storage.title": "Ajiye da Kwas",
  "storage.subtitle": "Gudanar da bayanan ajiye",
  "storage.imageCache": "Kwasin Hotuna",
  "storage.imageCacheDesc": "Hotunan bayanan martaba da daular da aka ajiye",
  "storage.videoCache": "Kwasin Vidyo",
  "storage.videoCacheDesc": "Fayilolin da aka sauke a gaba",
  "storage.thumbnailCache": "Kwasin Thumbnail",
  "storage.thumbnailCacheDesc": "Hotunan dubawa na vidyo",
  "storage.messageCache": "Kwasin Saƙi",
  "storage.messageCacheDesc": "Saƙonnin tattaunawa na ba a kan yanar gizo",
  "storage.clearAll": "Share Dukkan Kwas",
  "storage.clearAllConfirm": "Kuna da tabbacin kuna son share dukkan bayanan ajiye?",
  "storage.cacheCleared": "An share kwas cikin nasara",
  "storage.cleared": "An share",

  // ── Report Problem ───────────────────────────────────────────
  "report.title": "Rahoto Matsala",
  "report.subtitle": "Sanar da mu abin da ke faruwa",
  "report.description": "Bayani",
  "report.descriptionPlaceholder": "Gaya mana abin da ya faru...",
  "report.submitReport": "Tura Rahoto",
  "report.submitting": "Ana tura...",
  "report.success": "An tura rahoto cikin nasara",
  "report.couldNotSubmit": "Ba za a iya tura rahoto ba",
  "report.descriptionRequired": "Da fatan za a bayyana matsalar",

  // ── Levels / Leaderboard ─────────────────────────────────────
  "levels.title": "Matakai",
  "levels.yourLevel": "Matakin Ku",
  "levels.nextLevel": "Mataki na Gaba",
  "levels.pointsToNext": "Maki {{points}} zuwa mataki na gaba",
  "leaderboard.title": "Matsayi",
  "leaderboard.subtitle": "Matsayi & nasarori masu aiki",
  "leaderboard.thisWeek": "Wannan Makon",
  "leaderboard.allTime": "Duk lokacin",
  "leaderboard.rank": "Matsayi",
  "leaderboard.points": "Maki",

  // ── Story ────────────────────────────────────────────────────
  "story.viewStory": "Duba Tarihi",

  // ── Two-Factor Auth ──────────────────────────────────────────
  "twofa.title": "Tabbatar da Biyu",
  "twofa.enable": "Kunna 2FA",
  "twofa.disable": "Cire 2FA",
  "twofa.enterCode": "Shigar da lambar tabbatarwa",
  "twofa.codeSent": "An aika lambar tabbatarwa",
  "twofa.couldNotSend": "Ba za a iya aika lambar tabbatarwa ba.",
  "twofa.enabled": "An kunna 2FA cikin nasara",
  "twofa.disabled": "An cire 2FA cikin nasara",
  "twofa.invalidCode": "Lambar tabbatarwa ba ta dace ba",

  // ── Waveform Settings ────────────────────────────────────────
  "waveform.headerTitle": "Sautin Dogon Juyi na Saƙi",
  "waveform.shape": "SIHIRTSA",
  "waveform.barCount": "Adadin Bar",
  "waveform.barCountDesc": "Yawan bar da ke cikin waveform",
  "waveform.barCountFormat": "bar {{count}}",
  "waveform.barWidth": "Girman Bar",
  "waveform.barWidthDesc": "Matsewar kowane bar",
  "waveform.barWidthFormat": "{{count}}px",
  "waveform.barGap": "Filayen Bar",
  "waveform.barGapDesc": "Filayen tsakanin bar",
  "waveform.barGapFormat": "{{count}}px",
  "waveform.maxHeight": "Mafi Girman Tsawo",
  "waveform.maxHeightDesc": "Tsawon mafi girman bar",
  "waveform.maxHeightFormat": "{{count}}px",
  "waveform.color": "LAUNI",
  "waveform.trackOpacity": "Dorewar Track",
  "waveform.trackOpacityDesc": "Yadda bar da ba a karanta ba ke bayyana",
  "waveform.trackOpacityFormat": "{{count}}%",
  "waveform.playedBarColor": "Launin Bar da Aka Karanta",
  "waveform.playedBarColorDesc": "Ya bi bubbles — ja don zaɓi kowane launi",
  "waveform.auto": "Na kai tsaye",
  "waveform.autoMatchesBubble": "Na kai tsaye (ya bi bubbles)",
  "waveform.animation": "MOTSIN JUYI",
  "waveform.pulseSpeed": "Guduwar Pulse",
  "waveform.pulseSpeedDesc": "Lokacin pulse ɗaya",
  "waveform.pulseSpeedFormat": "{{count}}ms",
  "waveform.waveSpeed": "Guduwar Wave",
  "waveform.waveSpeedDesc": "Sake motsi tsakanin bar — ƙanƙanin yana tafiya da sauri",
  "waveform.waveSpeedFormat": "{{count}}ms",
  "waveform.pulseDepth": "Zurfin Pulse",
  "waveform.pulseDepthDesc": "Yawan rage girman bar lokacin aiki",
  "waveform.pulseDepthFormat": "{{count}}%",
  "waveform.resetDefaults": "Sake Saita Tsoho",
  "waveform.preview": "Dubawa Kai Tsaye",
  "waveform.settingsRestored": "An sake saita saitunan waveform zuwa tsoho",
  "waveform.saved": "An ajiye saituna",

  // ── Errors ───────────────────────────────────────────────────
  "error.generic": "Wani abu ya faru. Da fatan za a sake gwadawa.",
  "error.network": "Babu haɗin yanar gizo. Da fatan za a duba cibiyar sadarwar ku.",
  "error.unauthorized": "Lokacin ku ya ƙare. Da fatan za a shiga sake.",
  "error.notFound": "Abin da kuke nema ba a samu ba.",
  "error.permission": "Ba ku da izini don yin hakan.",
  "error.couldNotSend": "Ba za a iya aika ba. Da fatan za a sake gwadawa.",
  "error.couldNotLoad": "Ba za a iya lodawa data ba. Da fatan za a sake gwadawa.",
  "error.couldNotDelete": "Ba za a iya share ba. Da fatan za a sake gwadawa.",
  "error.couldNotSave": "Ba za a iya ajiye ba. Da fatan za a sake gwadawa.",
  "error.permissionDenied": "An拒绝 Ijin",
  "error.error": "Kuskure",

  // ── Success ──────────────────────────────────────────────────
  "success.saved": "An ajiye cikin nasara",
  "success.sent": "An aika cikin nasara",
  "success.deleted": "An share cikin nasara",
  "success.updated": "An sabunta cikin nasara",
  "success.copied": "An kwafi zuwa allon kwafin",
  "success.success": "Nasara",

  // ── Misc ─────────────────────────────────────────────────────
  "misc.today": "Yau",
  "misc.yesterday": "Jiya",
  "misc.thisWeek": "Wannan Makon",
  "misc.older": "Tsoho",
  "misc.justNow": "Yanzu",
  "misc.minutesAgo": "Minti {{count}} da suka wuce",
  "misc.hoursAgo": "Sa'a {{count}} da suka wuce",
  "misc.daysAgo": "Kwanaki {{count}} da suka wuce",
  "misc.giftReceived": "An samu Kyauta 🎁",
  "misc.giftSent": "{{name}} ya aika muku kyauta!",
  "misc.levelUp": "Ku haɓaka matakin!",
  "misc.newFollower": "{{name}} ya fara bi ku",
  "misc.comingSoon": "Zai zo Watar",
  "misc.noResults": "Ba a samu sakamako ba",
  "misc.pullToRefresh": "Juya don sabuntawa",
  "misc.cancel": "Soke",
  "misc.tryAgain": "Sake gwadawa",

  // ── Quick Actions ────────────────────────────────────────────
  "quickactions.title": "Ayyuka Sauri",
  "quickactions.leaderboard": "Matsayi",
  "quickactions.marketplace": "Kasuwanci",
  "quickactions.hostels": "Hotela",
  "quickactions.events": "Abubuwan da ke faruwa",
  "quickactions.groups": "Karkara",
  "quickactions.achievement": "Nasarori",
  "quickactions.jobs": "Ayyuka",
  "quickactions.notes": "Bayanana",
  "quickactions.games": "Wasanni",
  "quickactions.aiTutor": "Malamin AI",
  "quickactions.elections": "Zaɓe",
  "ai.title": "Mataimakin AI",
  "ai.subtitle": "Tattaunawa & Taimako",
  "ai.newChat": "Tattaunawa Sabuwa",
  "ai.heroTitle": "Mataimakin AI",
  "ai.heroSubtitle": "Abokiyar ku ta zamani don kowace tambaya ko aiki.",
  "ai.heroGreeting": "Sannu! Yaya zan iya taimaka muku yau?",
  "ai.recentChats": "Tattaunawa Na Baya",
  "ai.noChats": "Babu tattaunawa ta bayan nan. Fara tattaunawa sabuwa!",
  "ai.untitledChat": "Tattaunawa Ba Tare Da Suna",
  "ai.tapToContinue": "Danna don ci gaba da tattaunawa",
  "ai.listening": "Na ji... (Danna mic don ƙare)",
  "ai.askAnything": " tambaya kowace abu...",
  "ai.deleteChat": "Share Tattaunawa",
  "ai.deleteChatConfirm": "Shin kuna da tabbacin kuna son share wannan tattaunawa?",
  "ai.couldNotDelete": "Ba a iya share tattaunawa. Da fatan za a sake gwadawa.",
  "ai.permissionCamera": "Ana buƙatar damar samun ɗakin hotuna!",
  "ai.permissionMic": "Ana buƙatar damar microphone.",
  "ai.errorSending": "Kuskure Wajen Aika",
  "ai.failedProcess": "Gazin aiwatar da buƙatar. Da fatan za a sake gwadawa.",
  "ai.noResponse": "Ba a sami amsa ba.",
  "comingSoon.badge": "ZAI ISA WATAN",
  "comingSoon.title": "Wani abu\nmai ban mamaki zai isa!",
  "comingSoon.subtitle": "Muna aiki da kyau don ba ku\ndam ƙwarewa sabuwa da duniya.",
  "comingSoon.stayTuned": "Ku riƙa sauraro!",
  "comingSoon.newFeatures": "Sabbin Fasaloli",
  "comingSoon.newFeaturesDesc": "Kayan aiki masu ƙarfi don ku",
  "comingSoon.betterExperience": "Ƙwarewa Mafi Kyau",
  "comingSoon.betterExperienceDesc": "Mai sauƙi, mai sauri kuma mai hankali",
  "comingSoon.excitingRewards": "Lada Masu Mamaki",
  "comingSoon.excitingRewardsDesc": "Ƙarin lada suna zuwa gare ku",
  "comingSoon.ctaTitle": "Ku zama na farko don sanin!",
  "comingSoon.ctaSubtitle": "Za mu sanar da ku idan muka fara.",
  "comingSoon.notifyMe": "Sanar Da Ni",
  "comingSoon.notified": "An Sanar!",
  "comingSoon.goBack": "Koma Gida",
  "comingSoon.onTheList": "Kuna cikin jeri!",
  "comingSoon.willNotify": "Za mu sanar da ku idan muka fara.",
  "jobs.detailTitle": "Bayanin Aiki",
  "jobs.detailSubtitle": "Sharuɗɗɗan, tsarin neman aiki da bayanin aikin",
  "jobs.loadingDetails": "Ana lodawa bayanin aiki...",
  "jobs.notFound": "Ba A Sami Aiki Ba",
  "jobs.notFoundDesc": "Wannan sanonin aiki na iya rashin wahala",
  "jobs.description": "Bayani",
  "jobs.requirements": "Sharuɗɗɗan",
  "jobs.benefits": "Amfanai",
  "jobs.applicants": "masu neman aiki",
  "jobs.viewManage": "Duba kuma sarrafa masu neman aiki",
  "jobs.applyNow": "Nemi Aiki Yanzu",
  "jobs.applyTo": "Nemi Aiki a {{company}}",
  "jobs.coverLetterHint": "Rubuta takardar rantsuwa mai ƙarfi",
  "jobs.coverLetterPlaceholder": "Mai ba da aiki mai daraja, na sha wahala...",
  "jobs.submitApplication": "Tura Sanonin",
  "jobs.applications": "Sanonin Neman Aiki",
  "jobs.deleteJob": "Share Aiki",
  "jobs.deleteConfirm": "Shin kuna da tabbacin kuna son share wannan sanonin aiki?",
  "jobs.applicationSent": "An aika sanonin!",
  "jobs.applicationSubmitted": "An aika sanonin ku.",
  "jobs.statusUpdated": "An sabunta matsayi",
  "jobs.jobDeleted": "An share aiki",
  "jobs.failedToLoad": "Gazin lodawa bayanin aiki",
  "jobs.failedToApply": "Gazin nema aiki",
  "jobs.failedToLoadApps": "Gazin lodawa sanonin neman aiki",
  "jobs.failedToUpdate": "Gazin sabunta matsayi",
  "jobs.failedToDelete": "Gazin share aiki",
  "jobs.pleaseWriteCover": "Da fatan za a rubuta takardar rantsuwa",
  "jobs.loadingApplications": "Ana lodawa sanonin neman aiki...",
  "jobs.noApplications": "Babu sanonin neman aiki",
  "notes.title": "Bayanin",
  "notes.subtitle": "Kayoyin koyi, taƙaitaccen koyi & jagorori masu raba",
  "notes.allNotes": "Dukkan Bayanan",
  "notes.classes": "Darussa",
  "notes.personal": "Na Kai",
  "notes.bookmarks": "Alamomi",
  "notes.searchPlaceholder": "Nema bayanai...",
  "notes.pinned": "Alamomi ({{count}})",
  "notes.recentNotes": "Bayanan Na Baya",
  "notes.noNotes": "Ba a sami bayanai ba",
  "notes.newNote": "Bayani Sabuwa",
  "notes.editNote": "Gyara Bayani",
  "notes.category": "Rukunin",
  "notes.noteTitle": "Sunan Bayani",
  "notes.noteContent": "Fara rubuta bayanan koyi ko na nazarin ku nan...",
  "notes.general": "Na Gaba ɗaya",
  "notes.missingFields": "Da fatan za a shigo da suna da bayani.",
  "notes.failedToFetch": "Gazin ɗaukar bayanai daga uwar garke.",
  "notes.failedToRefresh": "Gazin sabunta bayanai.",
  "notes.failedToSave": "Gazin ajiye bayanai a uwar garke.",
  "notes.failedToPin": "Gazin sabunta matsayin pin.",
  "notes.failedToBookmark": "Gazin sabunta matsayin alama.",
  "notes.failedToDelete": "Gazin share bayani.",
  "notes.deleteNote": "Share Bayani",
  "notes.deleteConfirm": "Shin kuna da tabbacin kuna son share wannan bayani?",
  "pastQ.uploadTitle": "Bardaɗɗen Tambayoyin da suka gabata",
  "pastQ.uploadSubtitle": "Taimaka wa abokan ku su ci nasara",
  "pastQ.tips": "Shawarwarin Bardingawa",
  "pastQ.verifiedOnly": "Don dalibai da ake tabbatar da shi kawai",
  "pastQ.verifiedDesc": "Tambayoyin da suka gabata suna nan don dalibai a cikin yunwarar ku da rukunin da ya dace.",
  "pastQ.academicDetails": "Bayanin Ilimi",
  "pastQ.academicDetailsHint": "Tabbatar da cewa wannan bayanin yana daidai don sauran su sami budewar ku.",
  "pastQ.level": "Mataki",
  "pastQ.selectLevel": "Zaɓi Mataki",
  "pastQ.courseCode": "Lambar Kursi",
  "pastQ.courseCodePlaceholder": "misali. CSC 312",
  "pastQ.courseTitle": "Sunan Kursi / Batu",
  "pastQ.courseTitlePlaceholder": "misali. Data Structures & Algorithms",
  "pastQ.academicSession": "Zaman Ilimi",
  "pastQ.selectSession": "Zaɓi Zaman",
  "pastQ.examSemester": "Rabin Shekarar Imtihani",
  "pastQ.uploadFiles": "Bardaɗɗen Fayiloli",
  "pastQ.uploadFilesHint": "Bardaɗɗen fayiloli masu ban kayatarwa. Za ku iya bardinga fayiloli da yawa.",
  "pastQ.tapToUpload": "Danna don bardinga fayiloli",
  "pastQ.fileFormats": "JPG, PNG har zuwa 10MB kowanne",
  "pastQ.addMore": "Ƙara fayiloli",
  "pastQ.disclaimerTitle": "Da fatan za a tabbata:",
  "pastQ.disclaimerBullet1": "Tambayoyin suna daga yunwarar ku.",
  "pastQ.disclaimerBullet2": "Bardingawa marasa kyau ko kuskure na iya haifar da dawwama.",
  "pastQ.uploading": "Ana bardinga...",
  "pastQ.uploadButton": "Bardaɗɗen Tambayoyin da suka gabata",
  "pastQ.onlyInstitution": "Dalibai a cikin yunwarar ku kawai za su iya ganin wannan abu.",
  "pastQ.selectOption": "Zaɓi {{type}}",
  "pastQ.uploadSuccess": "An yi nasarar lodi tambayoyin ku.",
  "pastQ.uploadSuccessful": "An yi nasarar lodi",
  "searchResults.all": "Duka",
  "searchResults.people": "Mutane",
  "searchResults.schools": "Yunwarori",
  "searchResults.courses": "Kursi",
  "searchResults.unknownSchool": "Yunwarar da ba a sani ba",
  "searchResults.unknownDept": "Rukunin da ba a sani ba",
  "searchResults.student": "Dalibi",
  "verification.title": "Tabbatar da Dalibi",
  "verification.subtitle": "Tabbatar da halittar yunwarar ku",
  "verification.studentId": "Katin Dalibi",
  "verification.admissionLetter": "Lambar Shiga",
  "verification.uploadId": "Bardaɗɗen Katin Dalibi",
  "verification.uploadLetter": "Bardaɗɗen Lambar Shiga",
  "verification.confirmDocs": "Na tabbatar da cewa wannan takardu nawa ne",
  "verification.submit": "Tura Don Tabbatarwa",
  "verification.submitting": "Ana tura...",
  "verification.successMsg": "An aika takardar ku. Tabbatarwa koyaushe tana ɗaukar sauran awanni 24.",
  "verification.successTitle": "An Fara Tabbatarwa",
  "verification.uploadAtLeast": "Da fatan za a bardiɗɗe takardi ɗaya aƙalla.",
  "verification.confirmDocuments": "Da fatan za a tabbatar da cewa takardu nawa ne.",
  "twofaVerify.title": "Tabbatar da Halitta",
  "twofaVerify.subtitle": "Shigar da lambar da aka aika zuwa kayan aikin ku",
  "twofaVerify.verify": "Tabbatar",
  "twofaVerify.resend": "Sake Aika Lambar",
  "twofaVerify.codeSent": "An aika sabuwa lambar",
  "twofaVerify.invalidCode": "Lambar ba ta dace ba. Da fatan za a sake gwadawa.",
  "twofaVerify.verified": "An tabbatar da halitta cikin nasara",
  "pastQ.failedToLoad": "Gazin ɗaukar tambayoyin da suka gabata.",
  "pastQ.noDownloadLink": "Babu hanyar saukar wannan fayil.",
};

export default ha;

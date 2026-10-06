// translations/yo.ts
// Yorùbá

import type { TranslationKey } from "./en";

const yo: Partial<Record<TranslationKey, string>> = {
  // ── Navigation / Tabs ────────────────────────────────────────
  "tab.home": "Ilé",
  "tab.explore": "Ṣàwárí",
  "tab.messages": "Ìròyìn",
  "tab.following": "Tí ń Tẹ̀lẹ̀",
  "tab.materials": "Ohun èlò",
  "tab.profile": "Profaìlù",

  // ── Common Actions ───────────────────────────────────────────
  "action.back": "Padà",
  "action.done": "Parí",
  "action.cancel": "Fagilee",
  "action.save": "Fi pẹ̀lú",
  "action.delete": "Parẹ́",
  "action.edit": "Ṣàtúnṣe",
  "action.send": "Ránṣẹ́",
  "action.confirm": "Jẹ́rìí",
  "action.yes": "Bẹ́ẹ̀ni",
  "action.no": "Rárá",
  "action.close": "Tí",
  "action.retry": "Gbìyànjú ọ̀kan sí i",
  "action.submit": "Fi sílẹ̀",
  "action.next": "Èkejì",
  "action.previous": "Ìgbàlẹ́",
  "action.apply": "Lo",
  "action.search": "Wá",
  "action.loading": "Ń lodi...",
  "action.refresh": "Ṣe tuntun",
  "action.share": "Pín",
  "action.copy": "Ṣe àpèjúde",
  "action.viewAll": "Wo Gbogbo",
  "action.seeMore": "Wo Sí i",
  "action.seeLess": "Wo Kékeré",
  "action.learnMore": "Kọ́ Sí i",
  "action.submitting": "Ń fi sílẹ̀...",
  "action.deactivate": "Fagilee",

  // ── Auth ─────────────────────────────────────────────────────
  "auth.login": "Wọlé",
  "auth.signup": "Kọjú",
  "auth.logout": "Jáde",
  "auth.forgotPassword": "Gbàgbé Ọ̀rọ̀ Ìkọ̀run?",
  "auth.resetPassword": "Tún Ọ̀rọ̀ Ìkọ̀run Ṣe",
  "auth.enterEmail": "Tẹ̀ ìmélì rẹ̀ sílẹ̀",
  "auth.enterPassword": "Tẹ̀ ọ̀rọ̀ ìkọ̀run rẹ̀ sílẹ̀",
  "auth.confirmPassword": "Jẹ́rìí ọ̀rọ̀ Ìkọ̀run rẹ̀",
  "auth.email": "Ìmélì",
  "auth.password": "Ọ̀rọ̀ Ìkọ̀run",
  "auth.fullName": "Orúkọ Kíkún",
  "auth.username": "Orúkọ Amfà",
  "auth.phone": "Nọ́mbà Fóònù",
  "auth.noAccount": "Kò ní àkàwnt?",
  "auth.hasAccount": "Ní àkàwnt tẹ́lẹ̀?",
  "auth.continueWithGoogle": "Tẹ̀síwájú pẹ̀lú Google",

  // ── Profile ──────────────────────────────────────────────────
  "profile.title": "Profaìlù",
  "profile.editProfile": "Ṣàtúnṣe Profaìlù",
  "profile.followers": "Àwọn Tí ń Tẹ̀lẹ̀",
  "profile.following": "Tí ń Tẹ̀lẹ̀",
  "profile.posts": "Àwọn Ìkọ̀sílẹ̀",
  "profile.follow": "Tẹ̀lẹ̀",
  "profile.unfollow": "Dá àdúgbò kúrò",
  "profile.followingYou": "Ń tẹ̀lẹ̀ ọ",
  "profile.block": "Dì",
  "profile.unblock": "Yọ Dí kúrò",
  "profile.report": "Kílọ̀",
  "profile.message": "Ìròyìn",
  "profile.shareProfile": "Pín Profaìlù",
  "profile.manageAccount": "Ṣakoso gbogbo ohun nípa àkàwnt rẹ",
  "profile.account": "ÀKÀWNT",
  "profile.activity": "IṢẸ́",
  "profile.studentVerification": "Ìdájọ́ Akẹ́kọ́",
  "profile.verifyIdentity": "Jẹ́rìí ìdánilójú ilé-ìwé rẹ",
  "profile.achievements": "Ìṣẹ́gun",
  "profile.likes": "Ifẹ́ràn",
  "profile.gifts": "Gbíyànjú",
  "profile.anonymousStudent": "Akẹ́kọ́ Aláìlérí",
  "profile.tabPosts": "Àwọn Ìkọ̀sílẹ̀",
  "profile.tabReshares": "Pínpín",
  "profile.tabDrafts": "Àwọn Adraft",
  "profile.tabHidden": "Tí A Fihàn Sílẹ̀",
  "profile.tabSaved": "Tí A Fi Pẹ̀lú",
  "profile.tabTagged": "Tí A Tag",
  "profile.noContent": "Kò Sí Ohunkóhun",
  "profile.emptyTab": "Kò sí {{tab}} tí a rí",

  // ── Settings ─────────────────────────────────────────────────
  "settings.title": "Àtòjọ",
  "settings.notifications": "Ìfúnni",
  "settings.privacySecurity": "Ìkọ̀run àti Ààbò",
  "settings.language": "Èdè",
  "settings.appearance": "Ìrírí",
  "settings.dark": "Ókùnkùn",
  "settings.light": "Ìmọ́lẹ̀",
  "settings.storageCache": "Ìpamọ́ àti Kàsì",
  "settings.helpSupport": "Ìrànwọ́ àti Àtìlẹ́yìn",
  "settings.reportProblem": "Kílọ̀ wahálà",
  "settings.blockedUsers": "Àwọn Tí Wọ́n Dì",
  "settings.accountAction": "Àkàwnt",
  "settings.deactivateAccount": "Fagilee Àkàwnt",
  "settings.deleteAccount": "Parẹ́ Àkàwnt",
  "settings.onlineStatus": "Iṣẹ́ Lórí Àárín",
  "settings.readReceipts": "Ìrírí Kíkà",
  "settings.activityStatus": "Iṣẹ́",
  "settings.marketplace": "Ìjà",
  "settings.hostel": "Ilé",
  "settings.leaderboard": "Ìṣòro àti Ìpọ̀nwó",
  "settings.general": "Gbogboogbò",
  "settings.soundEnabled": "Ohùn",
  "settings.waveform": "Ohùn Ìròyìn",
  "settings.waveformDesc": "Ṣe àtúnṣe àpẹẹrẹ ìròyìn ohùn",
  "settings.manageCachedData": "Ṣakoso dátà tí wọ́n ti fi pẹ̀lú",

  // ── Language ─────────────────────────────────────────────────
  "language.title": "Èdè",
  "language.select": "YAN ÉDÉ RẸ",
  "language.updated": "Èdè ti ṣe àtúnṣe",
  "language.setTo": "Èdè ti sọ sí {{language}}",
  "language.footer": "Èdè app yóò ṣe àtúnṣe lórí gbogbo àwọn ìrírí. Àwọn nǹkan kan láti ọwọ́ àwọn mìíràn lè jẹ́ ní èdè àkọ́kọ́ wọn.",

  // ── Messages / Chat ──────────────────────────────────────────
  "chat.title": "Ìròyìn",
  "chat.subtitle": "Ń sókàn pẹ̀lú àwọn ọmọwé",
  "chat.searchPlaceholder": "Wá ìròyìn...",
  "chat.noMessages": "Kò sí ìròyìn kankan tí ì ṣe",
  "chat.startConversation": "Bẹ̀rẹ̀ sísọ",
  "chat.typeMessage": "Kọ ìròyìn...",
  "chat.updateMessage": "Ṣàtúnṣe ìròyìn...",
  "chat.loading": "Ń ṣí ìjíròrò...",
  "chat.send": "Ránṣẹ́",
  "chat.online": "Lórí Àárín",
  "chat.offline": "Kò Lórí Àárín",
  "chat.typing": "ń kọ...",
  "chat.leftTheChat": "{{name}} jáde sí i",
  "chat.joinedTheChat": "{{name}} wọlé sí i",
  "chat.sentGift": "{{name}} ránṣẹ́ {{gift}} x{{count}}",
  "chat.pinnedMessage": "Ìròyìn tí a fi Àmì sí",
  "chat.unpinMessage": "Yọ Àmì kúrò",
  "chat.replyTo": "Padà sí {{name}}",
  "chat.jumpToMessage": "Lọ sí ìròyìn",
  "chat.messageNotInView": "Ìròyìn kò wà ní ìrísí",
  "chat.messageNotLoaded": "Ìròyìn àkọ́kọ́ kò sí nínú ìjíròrò yìí síbẹ̀síbẹ̀.",
  "chat.deleteMessage": "Parẹ́ Ìròyìn",
  "chat.editMessage": "Ṣàtúnṣe Ìròyìn",
  "chat.copyMessage": "Ṣe àpèjúde",
  "chat.replyMessage": "Padà",
  "chat.pinMessage": "Fi Àmì sí Ìròyìn",
  "chat.deleteConfirmTitle": "Parẹ́ ìròyìn yìí?",
  "chat.deleteConfirmBody": "Ìṣẹ̀ ṣe yìí kò lè tún ṣe.",
  "chat.messageUpdated": "Ìròyìn ti ṣe àtúnṣe",
  "chat.messageDeleted": "Ìròyìn ti parẹ́",
  "chat.couldNotDeleteMessage": "Kò lè parẹ́ ìròyìn",
  "chat.couldNotSendVoiceNote": "Kò lè ránṣẹ́ ìròyìn ohùn",
  "chat.couldNotStartRecording": "Kò lè bẹ̀rẹ̀ ìrèkọ̀dà",
  "chat.couldNotStopRecording": "Kò lè dínkú ìrèkọ̀dà",
  "chat.permissionMediaRequired": "Ìyọ̀rọ̀ sí líbrárì media jẹ́ ohun tí a nílò.",
  "chat.permissionMicRequired": "Ìyọ̀rọ̀ sí microphone jẹ́ ohun tí a nílò láti kọ ìròyìn ohùn.",
  "chat.connectionFailed": "Ìsọ̀kan Kùsí",
  "chat.showingSavedMessages": "Kò ní inthanetì — a ń hàn àwọn ìròyìn rẹ tí a ti fi pẹ̀lú.",
  "chat.chatError": "Ìṣòro Ìjíròrò",
  "chat.couldNotStart": "Kò lè bẹ̀rẹ̀ ìjíròrò.",
  "chat.couldNotSendGift": "Kò lè ránṣẹ́ gbíyànjú",
  "chat.notificationsMuted": "Ìfúnni Ti Din",
  "chat.notificationsUnmuted": "Ìfúnni Ti Ji",
  "chat.chatBubbleUpdated": "Bubble chat ti ṣe àtúnṣe",
  "chat.couldNotSyncBubble": "Kò lè sọ àpèjúdé bubble",
  "chat.actionFailed": "Ìṣẹ̀ ṣe kùsí",
  "chat.deleteChat": "Parẹ́ Ìjíròrò",
  "chat.deleteChatConfirm": "Parẹ́ ìjíròrò yìí?",
  "chat.deleteChatBody": "Gbogbo ìròyìn yóò parẹ́ ní títì.",
  "chat.chatDeleted": "Ìjíròrò Ti Parẹ́",
  "chat.couldNotDeleteChat": "Kò lè parẹ́ ìjíròrò",
  "chat.customizeBubble": "Ṣàtúnṣe Bubble",
  "chat.chatBackground": "Ìṣàlẹ̀ Ìjíròrò",
  "chat.sharedMedia": "Media Tí A Pín",
  "chat.viewProfile": "Wo Profaìlù",
  "chat.mute": "Din",
  "chat.unmute": "Ji",
  "chat.pinChat": "Fi Àmì sí Ìjíròrò",
  "chat.unpinChat": "Yọ Àmì kúrò nínú Ìjíròrò",
  "chat.searchMembers": "Wá àwọn ọmọ...",
  "chat.left": "jáde",
  "chat.joined": "wọlé",
  "chat.pinned": "fi àmì sí",
  "chat.unpinned": "yọ àmì kúrò",
  "chat.addReaction": "Fi ìfẹ́ràn sí",
  "chat.reply": "Padà",
  "chat.replyToMessage": "Padà sí {{name}}",
  "chat.cancelReply": "Fagilee ìpadà",
  "chat.gallery": "Àpèjúdé",
  "chat.document": "Íwé",
  "chat.recordVoice": "Kọ Ohùn",
  "chat.stopRecording": "Dínkú Ìrèkọ̀dà",
  "chat.cancelRecording": "Fagilee",
  "chat.sendVoice": "Ránṣẹ́",
  "chat.listenVoice": "Gbọ́",
  "chat.deleteVoice": "Parẹ́",
  "chat.messagePlaceholder": "Ìròyìn",
  "chat.updatePlaceholder": "Ṣàtúnṣe ìròyìn...",
  "chat.typePlaceholder": "Kọ ìròyìn...",
  "group.searchMembers": "Wá àwọn ọmọ...",
  "group.searchDefault": "Wá àwọn ẹgbẹ́ aláṣẹ...",
  "group.searchMy": "Wá àwọn ẹgbẹ́ mi...",

  // ── Posts / Feed ─────────────────────────────────────────────
  "post.like": "Fẹ́ràn",
  "post.unlike": "Kò fẹ́ràn",
  "post.comment": "Ìtọ́ka",
  "post.comments": "Àwọn Ìtọ́ka",
  "post.share": "Pín",
  "post.delete": "Parẹ́ Ìkọ̀sílẹ̀",
  "post.edit": "Ṣàtúnṣe Ìkọ̀sílẹ̀",
  "post.report": "Kílọ̀ Ìkọ̀sílẹ̀",
  "post.noPosts": "Kò sí ìkọ̀sílẹ̀ kankan",
  "post.writeSomething": "Kọ ohunkóhun...",
  "post.likedBy": "Fẹ́ràn nípasẹ̀ {{name}}",
  "post.commentsCount": "ìtọ́ka {{count}}",
  "post.loadingFeed": "Ń gbé feed rẹ sókè…",
  "post.noPostsInTab": "Kò sí ìkọ̀sílẹ̀ nínú {{tab}}",
  "post.beTheFirst": "Jẹ́ akọ́kọ́ tí yóò kọ ìkọ̀sílẹ̀ tàbí wo sí i lẹ́yìn.",
  "post.refreshFeed": "Ṣe Tuntun Feed",
  "post.sharedToFeed": "Ìkọ̀sílẹ̀ ti pín sí feed rẹ",
  "post.couldNotShare": "Kò lè pín ìkọ̀sílẹ̀ yìí báyísí.",
  "post.reportedSuccess": "Ìkọ̀sílẹ̀ ti kílọ̀ ní ìṣẹ́gun",
  "post.couldNotReport": "Kò lè kílọ̀ ìkọ̀sílẹ̀ yìí báyísí.",
  "post.deletedSuccess": "Ìkọ̀sílẹ̀ ti parẹ́ ní ìṣẹ́gun",
  "post.commentsTitle": "Àwọn Ìtọ́ka",
  "post.noComments": "Kò sí ìtọ́ka kankan. Jẹ́ akọ́kọ́!",
  "post.addComment": "Fi ìtọ́ka sí...",

  // ── Groups ───────────────────────────────────────────────────
  "group.title": "Àwọn Ẹgbẹ́",
  "group.create": "Ṣẹ̀dá Ẹgbẹ́",
  "group.join": "Wọlé sí Ẹgbẹ́",
  "group.leave": "Jáde sí Ẹgbẹ́",
  "group.members": "Àwọn Ọmọ Ẹgbẹ́",
  "group.member": "Ọmọ Ẹgbẹ́",
  "group.name": "Orúkọ Ẹgbẹ́",
  "group.description": "Àpèjúde",
  "group.noGroups": "Kò sí ẹgbẹ́ kankan",
  "group.searchPlaceholder": "Wá àwọn ẹgbẹ́...",
  "group.online": "{{count}} lórí àárín",

  // ── Notifications ────────────────────────────────────────────
  "notifications.title": "Ìfúnni",
  "notifications.noNotifications": "Kò sí ìfúnni kankan",
  "notifications.markAllRead": "Fi àmì sí gbogbo",
  "notifications.settings": "Àtòjọ Ìfúnni",

  // ── Explore ──────────────────────────────────────────────────
  "explore.title": "Ṣàwárí",
  "explore.searchPlaceholder": "Wá kampas...",
  "explore.trending": "Ń lọ",
  "explore.latest": "Ìkẹ́yìn",
  "explore.forYou": "Fún ọ",
  "explore.searchTagUser": "Wá ènìyàn kankan láti tag",
  "explore.searchTagMode": "Wá {{mode}} láti tag",

    "explore.tagPeople": "Fifi Àwọn Aráìná",

    "explore.followers": "Ẹ̀fẹ̀ẹ̀kà",

    "explore.following": "Ẹ Fi Sẹ́yìn",

    "explore.selected": "{{count}} ti a yan",

    "explore.typeToSearch": "Tẹ̀ kọ̀wọ́ láti wá aráìná kankan.",

    "explore.noUsersToTag": "Kò sí {{mode}} láti fi tẹ̀gì.",

    "explore.postPreview": "Ìfìdí Rírì Ìkọ̀sílẹ̀",

    "explore.feedPreview": "Ìfìdí Rírì Fíídì",

    "explore.privacyDistribution": "Ìṣí̀rò àti Fípamọ́",

    "explore.whoCanSee": "Tani ló ṣe é rí ìkọ̀sílẹ̀ yìí?",

    "explore.whoCanComment": "Tani ló ṣe é fi ọ̀rọ̀ sílẹ̀?",

    "explore.categoryLabel": "Ẹ̀ka",

    "explore.categoryNone": "Kò sí",
    "explore.public": "Gbogbo ènìyàn",
    "explore.friends": "Ọ̀rẹ̀",
    "explore.schoolOnly": "Ilé-ìwé nìkan",
    "explore.everyone": "Gbogbo ènìyàn",
    "explore.nobody": "Kò sí ẹni",

    "explore.giftsTipping": "Gbíyànjú àti Ìfúnni",

    "explore.allowed": "A gba mí",

    "explore.disabled": "Kò sí",

    "explore.editPost": "Ṣe Àtúnṣe Ìkọ̀sílẹ̀",

    "explore.publishNow": "Kọ̀sílẹ̀ Yì",

    "explore.publishing": "Ń Kọ̀sílẹ̀...",

    "explore.hdrActive": "HDR LÓ Ó LỌ",

    "explore.recordingPaused": "Ó PÁ DÍN",

    "explore.recording": "Ń GBADÚN",

    "explore.permissionCameraTitle": "A Nílò Ìyọ̀rísí",

    "explore.permissionCameraMsg": "A gbọ́dọ̀ ní ìyọ̀rísí kámrá láti gbajẹ̀ kọ̀wọ́ àti fídíò.",

    "explore.permissionMicTitle": "A Nílò Ìyọ̀rísí",

    "explore.permissionMicMsg": "A gbọ́dọ̀ ní ìyọ̀rísí máìkì láti gbajẹ̀ fídíò pẹ̀lú ohùn.",

    "explore.permissionGalleryTitle": "A Nílò Ìyọ̀rísí",

    "explore.permissionGalleryMsg": "A gbọ́dọ̀ ní ìyọ̀rísí láti wọ inú árírí gbíyànjú rẹ!",

    "explore.missingContentTitle": "Kò Sí Ohunkóhun",

    "explore.missingContentMsg": "Jọ̀wọ́ kọ ọ̀rọ̀ tí ìkọ̀sílẹ̀ rẹ pẹ̀lú àwọn fọ̀tò tàbí fídíò.",

    "explore.missingCaptionTitle": "Kò Sí Ọ̀rọ̀",

    "explore.missingCaptionMsg": "Jọ̀wọ́ kọ ọ̀rọ̀ fún ìkọ̀sílẹ̀ rẹ.",

    "explore.missingMediaTitle": "Kò Sí Àwọn Media",

    "explore.missingMediaMsg": "Jọ̀wọ́ kọ àwọn fọ̀tò tàbí fídíò kan.",

    "explore.publishSuccessTitle": "Ó Tọ́njú",

    "explore.publishSuccessMsg": "Ìkọ̀sílẹ̀ rẹ ti gbìyànjú!",

    "explore.publishErrorTitle": "Ìṣòro Ìkọ̀sílẹ̀",

    "explore.publishErrorMsg": "Kò lè fi ìkọ̀sílẹ̀ pamọ́",

    "post.captionPlaceholder": "Kí ni ohun tí ń ṣẹlẹ̀?",

    "post.addHashtag": "Fifi hashtag...",

    "post.selectCategory": "Yan Ẹ̀ka",

    "post.chooseAudience": "Yan Alábòsí",

    "post.whoCanComment": "Tani ló ṣe é fi ọ̀rọ̀ sílẹ̀?",

    "post.audienceLabel": "Alábòsí",

    "post.whoCanCommentLabel": "Tani ló ṣe é fi ọ̀rọ̀ sílẹ̀",

    "post.public": "Gbogbo èèyàn",

    "post.followers": "Ẹ̀fẹ̀ẹ̀kà",

    "post.schoolOnly": "Ilé-ẹkọ́ nìkan",

    "post.everyone": "Gbogbo èèyàn",

    "post.nobody": "Kò sí ẹni kan",

    "post.preview": "Ìfìdí Rírì",

    "post.campusLife": "Ìgbé Ayé Kẹmpásì",

    "post.academics": "Ẹ̀kọ́",

    "post.sports": "Ẹ̀yẹ",

    "post.hostel": "Ibi ìgbélẹ̀",

    "post.marketplace": "Ọjà",

    "post.events": "Àwọn Ìpàdé",

    "post.food": "Ounjẹ",

    "post.entertainment": "Ìrẹlẹ̀",

    "post.general": "Gbogbogbò",

    "post.commentsLocked": "A ti pairẹ̀ àwọn ìbáṣepọ̀",

    "post.commentsLockedDesc": "Olùdásí rẹ ti di ìsinsìnyí fún tani ló ṣe é rí àti fi ọ̀rọ̀ sílẹ̀ nípa ìkọ̀sílẹ̀ yìí.",

    "post.reply": "Ìdáhòrì",

    "post.hideReplies": "Fihìn àwọn ìdáhòrì",

    "post.viewReplies": "Wo àwọn ìdáhòrì {{count}}",

    "post.commentOptions": "Àwọn Àṣàyàn Ìbáṣepọ̀",

    "post.deleteComment": "Yọ Ìbáṣepọ̀ Kúrò",

    "post.reportComment": "Jẹ́ Kí Ìbáṣepọ̀ Mọ",

    "post.reportReasonTitle": "Jẹ́ Kí Ìbáṣepọ̀ Mọ",

    "post.reportReasonMsg": "Jọ̀wọ́ yan ìdí fún jẹ́ kí ìbáṣepọ̀ yìí mọ:",

    "post.selectReason": "Yan ìdí fún jẹ́ kí i mọ:",

    "post.cancel": "Fagile",

    "post.commentDeleted": "Ìbáṣepọ̀ ti pẹ níyì.",

    "post.couldNotDeleteComment": "Kò lè yọ ìbáṣepọ̀ kúrò. Jọ̀wọ́ gbiyanju lẹ́ẹ̀kan sí i.",

    "post.thankYouReport": "O ṣe púpọ̀ fún jẹ́ kí ìbáṣepọ̀ yìí mọ.",

    "post.couldNotReportComment": "Kò lè fi ìbáṣepọ̀ sílẹ̀. Jọ̀wọ́ gbiyanju lẹ́ẹ̀kan sí i.",

    "post.couldNotPostComment": "Kò lè fi ìbáṣepọ̀ sílẹ̀. Jọ̀wọ́ gbiyanju lẹ́ẹ̀kan sí i.",

    "post.spamScam": "Spam tàbí Ikile",

    "post.harassment": "Ìbájẹ́ tàbí Ìkòpin Ìjìyà",

    "post.inappropriate": "Ohunkóhun Tí Kò Tọ́",

    "post.other": "Ohun mìíràn",

    "hostel.coverBadge": "Àpèjúwe",

    "hostel.addPhoto": "Fi Fọ̀tò Rárá",

    "hostel.photoLimitTitle": "Ipín Tó Tóbi",

    "hostel.photoLimitMsg": "O lè sóò sílẹ̀ àwọn fọ̀tò di mẹ́wàá nìkan.",

    "hostel.photoPermTitle": "A Nílò Ìyọ̀rísí",

    "hostel.photoPermMsg": "O gbọ́dọ̀ fún àpótí fọ̀tò rẹ ní ìyọ̀rísí láti yan àwọn àwòrán.",

    "hostel.hostelNameLabel": "Orúkọ Ilé-igbó",

    "hostel.hostelNamePlaceholder": "Ile Sunshine",

    "hostel.descLabel": "Àpèjúwe",

    "hostel.descPlaceholder": "Sọ léàn tàlẹ̀ nípa ilé-igbó rẹ...",

    "hostel.validationError": "Ìṣòro Ìyọ̀rísí",

    "hostel.photoRequired": "Jọ̀wọ́ sóò sílẹ̀ fọ̀tò kan kíkan.",

    "hostel.nameRequired": "Orúkọ ilé-igbó jẹ́ ohun tí a gbọ́dọ̀ ní.",

    "hostel.descRequired": "Àpèjúwe jẹ́ ohun tí a gbọ́dọ̀ ní.",

    "hostel.fillRequired": "Jọ̀wọ́ kọ gbogbo ohun tí a gbọ́dọ̀ kọ.",

    "hostel.next": "Ìkejì",

    "hostel.roomTypeLabel": "Ìrú Ìyàrá",

    "hostel.genderLabel": "Ìkúnrinìkúnrín",

    "hostel.male": "Ọkùnrin",

    "hostel.female": "Obìnrin",

    "hostel.mixed": "Ìmixe",

    "hostel.maxOccupants": "O pọ̀ jù lọ",

    "hostel.totalRooms": "Ìyára Lápapọ̀",

    "hostel.availableRoomsLabel": "Ìyára Tó Wà",

    "hostel.availabilityLabel": "Ìwàlẹ̀",

    "hostel.availableNow": "Ó Wà Lánà",

    "hostel.nextMonth": "Ọdún Míìíràn",

    "hostel.comingSoon": "Ó ń Bọ̀",

    "hostel.lookingRoommate": "O ń wá alágbẹ́?",

    "hostel.seekingRoommate": "Ìkọ̀sílẹ̀ rẹ yóò fi hàn pé o ń wá alágbẹ́",

    "hostel.selfOnly": "O ń kọ̀sílẹ̀ ibì yìí fun ìwọ nìkan",

    "hostel.wifi": "Wi-Fi",

    "hostel.electricity247": "Iwẹ̀ Nígbogbogbò",

    "hostel.runningWater": "Omi",

    "hostel.security": "Aàbò",

    "hostel.cctv": "CCTV",

    "hostel.parking": "Ibí Fòòkù",

    "hostel.laundry": "Aṣọ",

    "hostel.kitchen": "Ibí Ìsn",

    "hostel.wardrobe": "Alágbẹ́ Àṣọ",

    "hostel.studyArea": "Ìbí Ìkọ́",

    "hostel.generator": "Genset",

    "hostel.fullyFurnished": "Ó Ti Ní gbogbo Àwọn Ohun",

    "hostel.airConditioner": "Air Conditioner",

    "hostel.balcony": "Balconi",

    "hostel.smartTv": "Smart TV",

    "hostel.contactPersonLabel": "Ẹni Tó ń Bá Sọ̀rọ̀",

    "hostel.contactPersonPlaceholder": "John Doe",

    "hostel.phoneLabel": "Nọ́mbà Fóònù",

    "hostel.phonePlaceholder": "+234 801 234 5678",

    "hostel.whatsappLabel": "Nọ́mbà WhatsApp",

    "hostel.emailLabel": "Adreesì Ímèlì",

    "hostel.emailPlaceholder": "hostel@email.com",

    "hostel.officeAddressLabel": "Adreesì Iṣẹ́ (A kì í ṣe)",

    "hostel.officeAddressPlaceholder": "12 Ugbowo Road",

    "hostel.contactHoursLabel": "Àkókò Ìbáránilẹ́nuwò",

    "hostel.contactHoursPlaceholder": "8:00 AM - 6:00 PM",

    "hostel.preferredContact": "Bá a Sọ̀rọ̀ Pẹ̀lú Ní",

    "hostel.previewLocation": "Ibí Tó Wà",

    "hostel.previewNear": "Nísinsìnyí {{school}}",

    "hostel.previewMonthlyRent": "Órí-ọ̀nà Oṣù Kọ̀ọ̀kan",

    "hostel.previewServiceCharge": "Owó Iṣẹ́:",

    "hostel.previewCautionFee": "Owó Ìdájọ́:",

    "hostel.previewTotal": "Lápapọ̀:",

    "hostel.previewRoomDetails": "Àlàyé Ìyàrá",

    "hostel.previewRoomType": "Ìrú Ìyàrá: {{type}}",

    "hostel.previewGender": "Ìkúnrinìkúnrín: {{gender}}",

    "hostel.previewCapacity": "Capacity: {{count}} Person(s)",

    "hostel.previewAvailableRooms": "Ìyára Tó Wà: {{count}}",

    "hostel.previewAmenities": "Àwọn Ohun Ìṣàbòrò",

    "hostel.previewRules": "Ìlànà",

    "hostel.previewCurfew": "Ìpilẹ̀ṣẹ̀: {{value}}",

    "hostel.previewVisitors": "Àwọn Òbí Ẹlẹgbẹ́: {{value}}",

    "hostel.previewPets": "Àwọn Eranko: {{value}}",

    "hostel.previewSmoking": "Símókì: {{value}}",

    "hostel.allowed": "Ó Tó",

    "hostel.notAllowed": "Kò Tó",

    "hostel.none": "Kò sí",

    "hostel.publishHostel": "Kọ̀sílẹ̀ Ilé-igbó",

    "hostel.publishing": "Ń Kọ̀sílẹ̀...",

    "hostel.publishSuccess": "A ti fi ìkéde ilé-gbígbé rẹ ránṣẹ́ sí alábòójútó fún ìfọwọ́sí, yóò sì fara hàn lẹ́yìn tí a bá fọwọ́ sí i.",

    "hostel.publishError": "Ohunkóhun kò lè rí.",

    "hostel.publishSuccessTitle": "A Fi Ránṣẹ́ Fún Àyẹ̀wò",

    "hostel.publishErrorTitle": "Ìṣòro",

    "feedCard.more": "Ṣì Shopọ̀",

    "feedCard.less": "Dí̀ẹ̀",

    "feedCard.editCaption": "Ṣe Àtúnṣe Àpèjúwe",

    "feedCard.editHashtags": "Ṣe Àtúnṣe Hashtags",

    "feedCard.changeCategory": "Yi Àtúnṣẹ̀pọ̀ Èká",

    "feedCard.changePermission": "Yi Ìyọ̀rísí Ìkọ̀sílẹ̀",

    "feedCard.giftSettings": "Ètò Gbíyànjú",

    "feedCard.playbackSpeed": "Ìyára Ìṣeré",

    "feedCard.playbackSpeedTitle": "Ìyára Ìṣeré",

    "feedCard.playbackSpeedHint": "Yan ìyára tí fídíò yìí yóò fi ṣiṣẹ́.",

    "feedCard.hideFromFeed": "Fihìn Ìkọ̀sílẹ̀ Kúrò nínú Fíídì",

    "feedCard.reportPost": "Jẹ́ Kí Ìkọ̀sílẹ̀ Mọ",

    "feedCard.deletePermanently": "Yọ Ìkọ̀sílẹ̀ Kúrò Láélẹ́",

    "feedCard.editCaptionTitle": "Ṣe Àtúnṣe Àpèjúwe",

    "feedCard.writeContext": "Kọ àlàyé níbì...",

    "feedCard.back": "Lẹ́yìn",

    "feedCard.save": "Fipamọ́",

    "feedCard.editHashtagsTitle": "Ṣe Àtúnṣe Hashtags",

    "feedCard.hashtagHint": "Yà àwọn tẹ̀gì pẹ̀lú àwọn ibi ikọ̀. Kò ṣe énilò kọ '#' symbol.",

    "feedCard.editCategoryTitle": "Ṣe Àtúnṣẹ̀pọ̀ Èká",

    "feedCard.editCategoryHint": "Rán àwọn ẹlẹgbẹ́ lọ́wọ́ láti rí ìkọ̀sílẹ̀ rẹ.",

    "feedCard.adjustPrivacy": "Ṣe Àtúnṣe Ìṣí̀rò àti Ìyọ̀rísí",

    "feedCard.giftSettingsTitle": "Ètò Gbíyànjú",

    "feedCard.giftSettingsHint": "Ṣakoso àwọn ètò owó fún àkọ̀sílẹ̀ yìí.",

    "feedCard.receiveAwards": "Gba Àwọn Ẹ̀fẹ́ àti Gbíyànjú",

    "feedCard.receiveAwardsHint": "Gba àwọn tokens dijítàlì àti gbíyànjú ní ìkọ̀sílẹ̀ yìí",

    "feedCard.savePreference": "Fipamọ́ Ìfẹ́",

    "feedCard.reportTitle": "Jẹ́ Kí Ìkọ̀sílẹ̀ Mọ",

    "feedCard.reportHint": "Jọ̀wọ́ sọ fún wa nípa ìdí tí ń jẹ́ kí o jẹ́ kí ìkọ̀sílẹ̀ yìí mọ. Ìbánsẹ̀ rẹ jẹ́ aláìlérí.",

    "feedCard.reportReasonPlaceholder": "Kọ ìdí rẹ níbì...",

    "feedCard.submitReport": "Fi Ìbánsẹ̀ Sílẹ̀",

    "feedCard.hideConfirmTitle": "Fihìn ìkọ̀sílẹ̀ yìí kúrò?",

    "feedCard.hideConfirmMsg": "Ìkọ̀sílẹ̀ yìí kò sí i sí lọ nínú fíídì ilé rẹ mọ́.",

    "feedCard.hidePost": "Fihìn Ìkọ̀sílẹ̀ Kúrò",

    "feedCard.deleteConfirmTitle": "Yọ ìkọ̀sílẹ̀ yìí kúrò?",

    "feedCard.deleteConfirmMsg": "Ṣe o ti dúpẹ̀ púpọ̀? Ìṣe yìí jẹ́ àìpẹ́.",

    "feedCard.delete": "Yọ Kúrò",

    "feedCard.cancel": "Fagile",

    "feedCard.update": "Ṣe Àtúnṣe",

    "feedCard.captionUpdated": "Àpèjúwe ti ṣe àtúnṣẹ̀ pẹ̀lú ayọ̀rẹ̀lẹ̀.",

    "feedCard.hashtagsUpdated": "Hashtags ti ṣe àtúnṣẹ̀ pẹ̀lú ayọ̀rẹ̀lẹ̀.",

    "feedCard.categorySaved": "Ẹ̀ka ti fipamọ́ pẹ̀lú ayọ̀rẹ̀lẹ̀.",

    "feedCard.privacyUpdated": "Ìṣí̀rò ti ṣe àtúnṣẹ̀ pẹ̀lú ayọ̀rẹ̀lẹ̀.",

    "feedCard.giftPrefsApplied": "Àwọn ìfẹ́ gbíyànjú ti wáyé.",

    "feedCard.postReported": "Ìkọ̀sílẹ̀ ti gbìyànjú.",

    "feedCard.postHidden": "Ìkọ̀sílẹ̀ ti fihìn kúrò nínú fíídì.",

    "feedCard.postDeleted": "Ìkọ̀sílẹ̀ ti yọ kúrò.",

    "feedCard.followError": "Kò lè ṣe àtúnṣẹ̀ ìwà bi alágbẹ́",

    "feedCard.reshareError": "Kò lè gbigba ìkọ̀sílẹ̀ gbangba. Jọ̀wọ́ gbiyanju lẹ́ẹ̀kan sí i.",

    "feedCard.favoritesError": "Kò lè ṣe àtúnṣẹ̀ àwọn ìfẹ́ràn.",

    "feedCard.giftFailed": "Gbíyànjú kò lè dé.",

    "feedCard.giftForbidden": "Gbíyànjú Kò Sí Láàárín",

    "giftSwitch.title": "Gba Èbún",

    "giftSwitch.subtitle": "Jẹ́ kí ènìyàn ránṣẹ́ èbún ìmọ̀ràn nínú post yìí",

    "stories.yourStory": "Ìtàn Rẹ",

    "stories.storyPublished": "Ìtàn Ti Kọ̀sílẹ̀!",

    "stories.storyPublishedMsg": "Ìtàn rẹ wà nílẹ̀ yìóò sẹ́yìn nínú awọn èrú 24.",

    "stories.storyError": "Ohunkóhun kò lè rí nígbà tí a ń pín ìtàn rẹ.",

    "createPost.placeholder": "Kí ni ohun tí ń ṣẹlẹ̀ ní kẹmpásì rẹ?",
    "createPost.title": "Ṣẹ̀dá Post",
    "createPost.preview": "Àwòrán Ìgbàgba",

    "post.replyingTo": "Ń da h̀or̀ si {{name}}",

    "post.writeComment": "Ko ibásẹpò...",

    "post.writeReply": "Ko idàhòri...",

    "post.viewReply": "Wo idàhòri {{count}}",

    "post.tagPeople": "Fi Awon Aràiná",

    "hostel.addressLabel": "Adreesi",

    "hostel.addressPlaceholder": "12 Ugbowo Road",

    "hostel.cityLabel": "Ilu",

    "hostel.cityPlaceholder": "Ilu Benin",

    "hostel.stateLabel": "Ipinle",

    "hostel.statePlaceholder": "Edo",

    "hostel.pricingLabel": "Ori Odu Oshu",

    "hostel.pricingPlaceholder": "250000",

    "hostel.serviceChargeLabel": "Owo Ise",

    "hostel.serviceChargePlaceholder": "20000",

    "hostel.cautionFeeLabel": "Owo Idaaju",

    "hostel.cautionFeePlaceholder": "15000",

    "hostel.totalCost": "Owo Lapapoo",

    "hostel.rulesTitle": "Ilana & Ilana Ise",

    "hostel.rulesSubtitle": "Soo Dalibin nipa ohun ti won le ra si",

    "hostel.visitorsAllowed": "A gba Obi Seku",

    "hostel.visitorsAllowedDesc": "Dalibi le gba obi seku",

    "hostel.smokingAllowedRule": "Siga Ni",

    "hostel.smokingAllowedDesc": "A le siga",

    "hostel.petsAllowedRule": "Eranko Ni",

    "hostel.petsAllowedDesc": "Dalibi le ni eranko",

    "hostel.generatorAvailable": "Genset Wonyi",

    "hostel.generatorAvailableDesc": "A fojun si lantarki wonyi",

    "hostel.curfewTime": "Akoko Ipinle",

    "hostel.curfewPlaceholder": "10:00 PM",

    "hostel.additionalRulesLabel": "Ilana Miiran",

    "hostel.additionalRulesPlaceholder": "Ko si orin oke lehin 10PM...",

  // ── Materials / Academic ─────────────────────────────────────
  "materials.title": "Ohun Èlò Ìmọ̀",
  "materials.subtitle": "Àwọn ìṣòro tí wọ́n ti kọjá, àwọn àkọsílẹ̀ àti ohun èlò ìkọ́",
  "materials.browseCategory": "Wòbí sí apá",
  "materials.pastQuestionsCount": "Ìṣòro 1000+",
  "materials.lectureNotes": "Àkọsílẹ̀",
  "materials.lectureNotesFormat": "PDF, DOC àti Slides",
  "materials.textbooks": "Ìwé",
  "materials.textbooksDesc": "Ìwé tí a gbà á",
  "materials.projectTopics": "Àkọ́kọ́ Project",
  "materials.projectTopicsDesc": "Ìròyìn Research",
  "materials.assignments": "Iṣẹ́",
  "materials.assignmentsDesc": "Homework àti Tasks",
  "materials.practicals": "Iṣẹ́ Practical",
  "materials.practicalsDesc": "Ìwé Lab",
  "materials.pastQuestions": "Àwọn Ìṣòro Tí Wọ́n Ti Kọjá",
  "materials.notes": "Àkọsílẹ̀",
  "materials.upload": "Gbé ohun èlò sókè",

  // ── Marketplace ──────────────────────────────────────────────
  "marketplace.title": "Ìjà",
  "marketplace.sell": "Tà",
  "marketplace.buy": "Rà",
  "marketplace.noItems": "Kò sí ohunkóhun",
  "marketplace.subtitle": "Ra, ta & yanje pẹ̀lú àwọn akẹ́kọ́",
  "marketplace.searchPlaceholder": "Wá ohun, àmì...",
  "marketplace.postMessage": "Ìkọ̀sílẹ̀ Ohun",
  "marketplace.price": "Iye Owó",
  "marketplace.negotiable": "Lè ṣe àtúnṣe",

  // ── Events ───────────────────────────────────────────────────
  "events.title": "Ìṣẹ̀lẹ̀",
  "events.subtitle": "Ìṣẹ̀lẹ̀ tó ń bọ̀, iṣẹ́ ara òun àti ìpàdé campus",

  // ── Jobs ─────────────────────────────────────────────────────
  "jobs.title": "Iṣẹ́ & Internship",
  "jobs.subtitle": "Àǹfààní iṣẹ́, ipo ìbẹ̀rẹ̀ àti iṣẹ́ akẹ́kọ́",
  "jobs.searchPlaceholder": "Wá iṣẹ́, ilé-iṣẹ́...",
  "jobs.detailTitle": "Àlàyé Iṣẹ́",
  "jobs.detailSubtitle": "Àwọn ìlò, ìlànà ìfọrọ̀wánilẹ́nuwò àti àpèjúdé ipo",
  "jobs.loadingDetails": "Ń gbé àlàyé iṣẹ́ sókè...",
  "jobs.notFound": "Kò Rí Iṣẹ́",
  "jobs.notFoundDesc": "Ìkọ̀sílẹ̀ iṣẹ́ yìí lè ti yọ kúrò",
  "jobs.description": "Àpèjúde",
  "jobs.requirements": "Àwọn ìlò",
  "jobs.benefits": "Àwọn àńfààní",
  "jobs.applicants": "àwọn olùfọrọ̀wánilẹ́nuwò",
  "jobs.viewManage": "Wo àti ṣakoso àwọn olùfọrọ̀wánilẹ́nuwò",
  "jobs.applyNow": "Fọrọ̀wánilẹ́nuwò Báyísí",
  "jobs.applyTo": "Fọrọ̀wánilẹ́nuwò sí {{company}}",
  "jobs.coverLetterHint": "Kọ ìwé ìfọrọ̀wánilẹ́nuwò tí yóò gbajúmọ̀",
  "jobs.coverLetterPlaceholder": "Olùdarí Ìfọrọ̀wánilẹ́nuwò Pàtàkì, mo interest sí...",
  "jobs.submitApplication": "Fi Ìfọrọ̀wánilẹ́nuwò Sílẹ̀",
  "jobs.applications": "Àwọn Ìfọrọ̀wánilẹ́nuwò",
  "jobs.deleteJob": "Parẹ́ Iṣẹ́",
  "jobs.deleteConfirm": "Ṣe o dá lórí pé o fẹ́ parẹ́ ìkọ̀sílẹ̀ iṣẹ́ yìí?",
  "jobs.applicationSent": "Ìfọrọ̀wánilẹ́nuwò ti ránṣẹ́!",
  "jobs.applicationSubmitted": "Ìfọrọ̀wánilẹ́nuwò rẹ ti fi sílẹ̀.",
  "jobs.statusUpdated": "Ipo ti ṣe àtúnṣe",
  "jobs.jobDeleted": "Iṣẹ́ ti parẹ́",
  "jobs.failedToLoad": "Kò lè gbé àlàyé iṣẹ́ sókè",
  "jobs.failedToApply": "Kò lè fọrọ̀wánilẹ́nuwò",
  "jobs.failedToLoadApps": "Kò lè gbé àwọn ìfọrọ̀wánilẹ́nuwò sókè",
  "jobs.failedToUpdate": "Kò lè ṣe àtúnṣe ipo",
  "jobs.failedToDelete": "Kò lè parẹ́ iṣẹ́",
  "jobs.pleaseWriteCover": "Jọ̀wọ́ kọ ìwé ìfọrọ̀wánilẹ́nuwò",
  "jobs.loadingApplications": "Ń gbé àwọn ìfọrọ̀wánilẹ́nuwò sókè...",
  "jobs.noApplications": "Kò sí ìfọrọ̀wánilẹ́nuwò kankan síbẹ̀síbẹ̀",

  // ── Wallet / Coins ───────────────────────────────────────────
  "wallet.title": "Ìpamọ́ Owó",
  "wallet.balance": "Iye",
  "wallet.coins": "Owó",
  "wallet.transactions": "Ìṣòwò",
  "wallet.earn": "Gba Owó",
  "wallet.spend": "Lo Owó",
  "wallet.dailyFree": "Àbọ́nú Òní",

  // ── Home / Feed ──────────────────────────────────────────────
  "home.title": "Ilé",

  // ── Search ───────────────────────────────────────────────────
  "search.title": "Wá Àwọn Ọmọwé",
  "search.subtitle": "Wá àwọn ènìyàn, ilé-ìwé, tàbí ìwé kọ́",
  "search.noResults": "Kò sí ìmúlò kankan",
  "search.searchPlaceholder": "Wá...",
  "search.showingResults": "Ó ń ṣe àwòrán fún \"{{query}}\"",
  "search.noResultsFound": "Kò sí ọmọwé kan tó bá fọwọ́ pọ̀ mọ́ \"{{query}}\"",
  "search.recentSearches": "Àwọn ìwádí tó kọjá ({{count}})",
  "search.clearAll": "Pẹ̀wẹ́ gbogbo rẹ̀",
  "search.noRecentSearches": "Kò sí ìwádí tó kọjá sí i",
  "search.suggestedStudents": "Ọmọwé tí a gbìyànjú sílẹ̀",
  "search.noSuggestedStudents": "Kò sí ọmọwé tí a gbìyànjú sílẹ̀",
  "search.trendingStudents": "Ọmọwé tí ó ń pọ̀ sí i",
  "search.noTrendingStudents": "Kò sí ọmọwé tí ó ń pọ̀ sí i",
  "search.follow": "Tẹ̀síwájú",
  "search.following": "Ó ń tẹ̀síwájú",

  // ── Search Results ───────────────────────────────────────────
  "searchResults.all": "Gbogbo",
  "searchResults.people": "Àwọn Ènìyàn",
  "searchResults.schools": "Àwọn Ilé-ìwé",
  "searchResults.courses": "Àwọn Kọ́sì",
  "searchResults.unknownSchool": "Ilé-ìyí àìmọ̀",
  "searchResults.unknownDept": "Apá àìmọ̀",
  "searchResults.student": "Akẹ́kọ́",

  // ── Followers ────────────────────────────────────────────────
  "followers.title": "Àwọn Tí ń Tẹ̀lẹ̀",
  "followers.following": "Tí ń Tẹ̀lẹ̀",
  "followers.noFollowers": "Kò sí àwọn tí ń tẹ̀lẹ̀ kankan",
  "followers.noFollowing": "Kò ń tẹ̀lẹ̀ ènìyàn kankan",
  "followers.couldNotLoad": "Kò lè gbé",
  "followers.couldNotUpdate": "Kò lè ṣe àtúnṣe ìgbàlẹ̀yìn",

  // ── Change Password ──────────────────────────────────────────
  "password.title": "Ṣàtúnṣe Ọ̀rọ̀ Ìkọ̀run",
  "password.subtitle": "Ṣàtúnṣe ọ̀rọ̀ ìkọ̀run àkàwnt rẹ",
  "password.currentPassword": "Ọ̀rọ̀ Ìkọ̀run Lọ́wọ́lọ́wọ́",
  "password.newPassword": "Ọ̀rọ̀ Ìkọ̀run Tuntun",
  "password.confirmNewPassword": "Jẹ́rìí Ọ̀rọ̀ Ìkọ̀run Tuntun",
  "password.currentPlaceholder": "Tẹ̀ ọ̀rọ̀ ìkọ̀run lọ́wọ́lọ́wọ́ sílẹ̀",
  "password.newPlaceholder": "Tẹ̀ ọ̀rọ̀ ìkọ̀run tuntun sílẹ̀",
  "password.confirmPlaceholder": "Jẹ́rìí ọ̀rọ̀ ìkọ̀run tuntun",
  "password.updateButton": "Ṣàtúnṣe Ọ̀rọ̀ Ìkọ̀run",
  "password.updatedSuccess": "Ọ̀rọ̀ Ìkọ̀run ti ṣe àtúnṣe ní ìṣẹ́gun",
  "password.couldNotUpdate": "Kò lè ṣe àtúnṣe ọ̀rọ̀ ìkọ̀run",
  "password.fieldsRequired": "Jọ̀wọ́ kún gbogbo àgbéjáde",
  "password.noMatch": "Àwọn ọ̀rọ̀ ìkọ̀run kò jẹ́ bi",
  "password.tooShort": "Ọ̀rọ̀ ìkọ̀run gbọ́dọ̀ jù 8 kọjá",

  // ── Edit Profile ─────────────────────────────────────────────
  "editProfile.title": "Ṣàtúnṣe Profaìlù",
  "editProfile.firstName": "Orúkọ Àkọ́kọ́",
  "editProfile.lastName": "Orúkọ Ìkẹ́yìn",
  "editProfile.username": "Orúkọ Amfà",
  "editProfile.bio": "Bio",
  "editProfile.school": "Ilé-ìwé",
  "editProfile.department": "Apá",
  "editProfile.level": "Ipín",
  "editProfile.phoneNumber": "Nọ́mbà Fóònù",
  "editProfile.saveChanges": "Fi Àtúnṣe Pẹ̀lú",
  "editProfile.profileUpdated": "Profaìlù ti ṣe àtúnṣe ní ìṣẹ́gun",
  "editProfile.couldNotUpdate": "Kò lè ṣe àtúnṣe profaìlù",
  "editProfile.changePhoto": "Yọ Foto Kúrò",
  "editProfile.takePhoto": "Gbà Foto",
  "editProfile.chooseFromLibrary": "Yan Láti Líbrárì",
  "editProfile.cancel": "Fagilee",

  // ── Account Action ───────────────────────────────────────────
  "account.deactivate": "Fagilee Àkàwnt",
  "account.delete": "Parẹ́ Àkàwnt",
  "account.deactivateTitle": "Fagilee Àkàwnt?",
  "account.deleteTitle": "Parẹ́ Àkàwnt?",
  "account.deactivateConfirm": "Ṣe o dá lórí pé o fẹ́ fagilee àkàwnt rẹ? O lè tún ṣí sílẹ̀.",
  "account.deleteConfirm": "Ṣe o dá lórí pé o fẹ́ parẹ́ àkàwnt rẹ? Ìṣẹ̀ ṣe yìí kò lè tún ṣe.",
  "account.cannotBeUndone": "Ìṣẹ̀ ṣe yìí kò lè tún ṣe.",
  "account.deactivateButton": "Fagilee Àkàwnt Mi",
  "account.deleteButton": "Parẹ́ Àkàwnt Mi",
  "account.deactivatedSuccess": "Àkàwnt ti fagilee",
  "account.deletedSuccess": "Àkàwnt ti parẹ́",

  // ── Storage & Cache ──────────────────────────────────────────
  "storage.title": "Ìpamọ́ àti Kàsì",
  "storage.subtitle": "Ṣakoso dátà tí wọ́n ti fi pẹ̀lú",
  "storage.imageCache": "Kàsì Awọrán",
  "storage.imageCacheDesc": "Àwọrán àti ohun èlò tí a ti fi pẹ̀lú",
  "storage.videoCache": "Kàsì Vídìò",
  "storage.videoCacheDesc": "Àwọn àpẹẹrẹ annimated tí a ti gbé sókè",
  "storage.thumbnailCache": "Kàsì Àpèjúdé Kékeré",
  "storage.thumbnailCacheDesc": "Àwọn àpèjúdé vídeo tí a mú sí ipo",
  "storage.messageCache": "Kàsì Ìròyìn",
  "storage.messageCacheDesc": "Ìròyìn ìjíròrò offline",
  "storage.clearAll": "Yọ Gbogbo Kàsì Kúrò",
  "storage.clearAllConfirm": "Ṣe o dá lórí pé o fẹ́ yọ gbogbo dátà tí a ti fi pẹ̀lú kúrò?",
  "storage.cacheCleared": "Kàsì ti parẹ́ ní ìṣẹ́gun",
  "storage.cleared": "Ti parẹ́",

  // ── Report Problem ───────────────────────────────────────────
  "report.title": "Kílọ̀ Wahálà",
  "report.subtitle": "Jẹ́ ká mọ ohun tí ó ń ṣẹlẹ̀",
  "report.description": "Àpèjúdé",
  "report.descriptionPlaceholder": "Sọ gbogbo ohun tí ó ṣẹlẹ̀...",
  "report.submitReport": "Fi Ìkílọ̀ Sílẹ̀",
  "report.submitting": "Ń fi sílẹ̀...",
  "report.success": "Ìkílọ̀ ti fi sílẹ̀ ní ìṣẹ́gun",
  "report.couldNotSubmit": "Kò lè fi ìkílọ̀ sílẹ̀",
  "report.descriptionRequired": "Jọ̀wọ́ ṣàpèjúdé wahálà náà",

  // ── Levels / Leaderboard ─────────────────────────────────────
  "levels.title": "Àwọn Ipín",
  "levels.yourLevel": "Ipín Rẹ",
  "levels.nextLevel": "Ipìn Kejì",
  "levels.pointsToNext": "Àmì {{points}} sí ipìn kejì",
  "leaderboard.title": "Ìṣòro",
  "leaderboard.subtitle": "Àwọn Ìṣòro àti Àwọn Ìṣẹ́gun Tí ń Ṣiṣẹ́",
  "leaderboard.thisWeek": "Ọ̀sẹ̀ Yìí",
  "leaderboard.allTime": "Gbogbo Ojoojúmọ́",
  "leaderboard.rank": "Ipín",
  "leaderboard.points": "Àmì",

  // ── Story ────────────────────────────────────────────────────
  "story.viewStory": "Wo Ìtàn",

  // ── Two-Factor Auth ──────────────────────────────────────────
  "twofa.title": "Ìdájọ́ Ipín Méjì",
  "twofa.enable": "Mú Ṣiṣẹ́ 2FA",
  "twofa.disable": "Dínkú 2FA",
  "twofa.enterCode": "Tẹ̀ kòòdù ìdájọ́ sílẹ̀",
  "twofa.codeSent": "Kòòdù ìdájọ́ ti ránṣẹ́",
  "twofa.couldNotSend": "Kò lè ránṣẹ́ kòòdù ìdájọ́.",
  "twofa.enabled": "2FA ti mú Ṣiṣẹ́ ní ìṣẹ́gun",
  "twofa.disabled": "2FA ti din ní ìṣẹ́gun",
  "twofa.invalidCode": "Kòòdù ìdájọ́ kò tọ́",

  // ── Two-Factor Verify ────────────────────────────────────────
  "twofaVerify.title": "Jẹ́rìí Ìdánilójú",
  "twofaVerify.subtitle": "Tẹ̀ kòòdù tí a ránṣẹ́ sí ẹ̀rọ rẹ sílẹ̀",
  "twofaVerify.verify": "Jẹ́rìí",
  "twofaVerify.resend": "Tún Ránṣẹ́ Kòòdù",
  "twofaVerify.codeSent": "Kòòdù tuntun ti ránṣẹ́",
  "twofaVerify.invalidCode": "Kòòdù àìtọ́. Jọ̀wọ́ gbìyànjú sí i.",
  "twofaVerify.verified": "Ìdánilójú ti ṣe ní ìṣẹ́gun",

  // ── Waveform Settings ────────────────────────────────────────
  "waveform.headerTitle": "Ohùn Ìròyìn Waveform",
  "waveform.shape": "ÀPÈJÚDÉ",
  "waveform.barCount": "Nọ́mbà Baa",
  "waveform.barCountDesc": "Báá mìíràn mìíràn ni ó jẹ́ waveform",
  "waveform.barCountFormat": "{{count}} báá",
  "waveform.barWidth": "Fífi Baa Sílẹ̀",
  "waveform.barWidthDesc": "Fífi báá kọ̀ọ̀kan sílẹ̀",
  "waveform.barWidthFormat": "{{count}}px",
  "waveform.barGap": "Ìyèkú Baa",
  "waveform.barGapDesc": "Ìyèkú láàárín àwọn báá",
  "waveform.barGapFormat": "{{count}}px",
  "waveform.maxHeight": "Gbígbọn Tó Pọ̀ Jù",
  "waveform.maxHeightDesc": "Gbígbọn báá tó pọ̀ jù",
  "waveform.maxHeightFormat": "{{count}}px",
  "waveform.color": "ÀWỌ̀",
  "waveform.trackOpacity": "Ìfífi Rí",
  "waveform.trackOpacityDesc": "Báá tí kò tí ṣiṣẹ́ bá á ní bi",
  "waveform.trackOpacityFormat": "{{count}}%",
  "waveform.playedBarColor": "Àwọ̀ Báá Tí A Ti Kàn Sílẹ̀",
  "waveform.playedBarColorDesc": "Ó ń tẹ̀lé bubble — rí anyí ká yàn àwọ̀ kankan",
  "waveform.auto": "Tíkàn Òun",
  "waveform.autoMatchesBubble": "Tíkàn Òun (ń tẹ̀lé bubble)",
  "waveform.animation": "ÀFÍHÀNJÚ",
  "waveform.pulseSpeed": "Ìrinsí Pulse",
  "waveform.pulseSpeedDesc": "Ìgbà tí pulse báá kan fi ń ṣiṣẹ́",
  "waveform.pulseSpeedFormat": "{{count}}ms",
  "waveform.waveSpeed": "Ìrinsí Wave",
  "waveform.waveSpeedDesc": "Ìyèkú láàárín àwọn báá — kékeré ń gbá jù",
  "waveform.waveSpeedFormat": "{{count}}ms",
  "waveform.pulseDepth": "Gbígbọn Pulse",
  "waveform.pulseDepthDesc": "Ìgbà tí báá ní gbígbọn nígbà tí ń ṣiṣẹ́",
  "waveform.pulseDepthFormat": "{{count}}%",
  "waveform.resetDefaults": "Tún Sí Ipò Àkọ́kọ́",
  "waveform.preview": "Àpèjúdé Gbígbóná",
  "waveform.settingsRestored": "Àtòjọ waveform ti padà sí ipò àkọ́kọ́",
  "waveform.saved": "Àtòjọ ti fi pẹ̀lú",

  // ── AI Assistant ─────────────────────────────────────────────
  "ai.title": "Olùgbéléhìn AI",
  "ai.subtitle": "Ìjíròrò & Ìrànwọ́ Kì",
  "ai.newChat": "Ìjíròrò Tuntun",
  "ai.heroTitle": "Olùgbéléhìn AI",
  "ai.heroSubtitle": "Olùgbéléhìn ìmọ̀ rẹ\\nfun ìbéèrè tàbí iṣẹ́ kankan.",
  "ai.heroGreeting": "Báwo ni mo lè\\nránṣọ́ fún ọ lọ́la?",
  "ai.recentChats": "Ìjíròrò Àkíyèsí",
  "ai.noChats": "Kò sí ìjíròrò àkíyèsí kankan. Bẹ̀rẹ̀ ìjíròrò tuntun!",
  "ai.untitledChat": "Ìjíròrò Láìkọ Orúkọ",
  "ai.tapToContinue": "Tẹ̀ láti tẹ̀síwájú ìjíròrò",
  "ai.listening": "Ń gbọ́... (Tẹ̀ mic láti parí)",
  "ai.askAnything": "Béèrè ohunkóhun...",
  "ai.deleteChat": "Parẹ́ Ìjíròrò",
  "ai.deleteChatConfirm": "Ṣe o dá lórí pé o fẹ́ parẹ́ ìjíròrò yìí?",
  "ai.couldNotDelete": "Kò lè parẹ́ ìjíròrò. Jọ̀wọ́ gbìyànjú sí i.",
  "ai.permissionCamera": "Ìyọ̀rọ̀ sí líbrárì kámaàrà jẹ́ ohun tí a nílò!",
  "ai.permissionMic": "Ìyọ̀rọ̀ sí microphone jẹ́ ohun tí a nílò.",
  "ai.errorSending": "Ìṣòro Fífi Ránṣẹ́",
  "ai.failedProcess": "Kò lè ṣe ìbéjọ. Jọ̀wọ́ gbìyànjú sí i.",
  "ai.noResponse": "Kò sí ìdáhùn tí a rí.",

  // ── Coming Soon ──────────────────────────────────────────────
  "comingSoon.badge": "Ó ŠI WÁYÉ",
  "comingSoon.title": "Ohunkóhun\nÀwọn Aṣíwèrè Ó Wá!",
  "comingSoon.subtitle": "A ń ṣiṣẹ́ dáadáa láti mu\nìrírí tuntun àti ńlá sí ọ.",
  "comingSoon.stayTuned": "Ń retí!",
  "comingSoon.newFeatures": "Àwọn Àṣà Tuntun",
  "comingSoon.newFeaturesDesc": "Ohun èlò alágbára fun ìwọ tó dára sínú",
  "comingSoon.betterExperience": "Ìrírí Tó Dára",
  "comingSoon.betterExperienceDesc": "Ó tóbi ju, ó káàrù àti ó ṣọ̀kan jùlọ",
  "comingSoon.excitingRewards": "Àwọn Àbọ́nú Tí Ó Yára",
  "comingSoon.excitingRewardsDesc": "Àwọn àbọ́nú síi ń bọ̀ sí ọ",
  "comingSoon.ctaTitle": "Jẹ́ akọ́kọ́ tó mọ!",
  "comingSoon.ctaSubtitle": "A yóò fi hàn pé a ti bẹ̀rẹ̀.",
  "comingSoon.notifyMe": "Fi hàn Mi",
  "comingSoon.notified": "Ti Fi Hàn!",
  "comingSoon.goBack": "Padà Ilé",
  "comingSoon.onTheList": "O wà nínú àtòjọ!",
  "comingSoon.willNotify": "A yóò fi hàn pé a ti bẹ̀rẹ̀.",

  // ── Notes ────────────────────────────────────────────────────
  "notes.title": "Àkọsílẹ̀",
  "notes.subtitle": "Ohun èlò ìkọ́, àpèjúdé kọ́ àti àwọn àlàwọ̀ a pín",
  "notes.allNotes": "Gbogbo Àkọsílẹ̀",
  "notes.classes": "Kọ́sì",
  "notes.personal": "Àìmọ̀",
  "notes.bookmarks": "Àwọn Àmì",
  "notes.searchPlaceholder": "Wá àkọsílẹ̀...",
  "notes.pinned": "Àmì ({{count}})",
  "notes.recentNotes": "Àkọsílẹ̀ Àkíyèsí",
  "notes.noNotes": "Kò sí àkọsílẹ̀ kankan",
  "notes.noNotesHint": "Tẹ̀ bọtìn \"+\" láti kọ àkọsílẹ̀ tàbí yàtọ̀ sí ìwádìí rẹ.",
  "notes.newNote": "Àkọsílẹ̀ Tuntun",
  "notes.editNote": "Ṣàtúnṣe Àkọsílẹ̀",
  "notes.category": "Àpá",
  "notes.noteTitle": "Orúkọ Àkọsílẹ̀",
  "notes.noteContent": "Bẹ̀rẹ̀ sí kọ àkọsílẹ̀ kọ́ tàbí àkọsílẹ̀ ìmọ̀ rẹ níbẹ̀...",
  "notes.general": "Gbogboogbò",
  "notes.missingFields": "Jọ̀wọ́ kún orúkọ àti àkọsílẹ̀.",

  // ── Past Questions ───────────────────────────────────────────
  "pastQ.uploadTitle": "Gbé Ìṣòro Àkọ́kọ́ Sókè",
  "pastQ.uploadSubtitle": "Ránṣọ́ àwọn akẹ́kọ́ rẹ sínú ìṣẹ́gun",
  "pastQ.tips": "Àwọn Ìmọ̀ràn Fífi Sókè",
  "pastQ.verifiedOnly": "Fun àwọn akẹ́kọ́ tí a ti jẹ́rìí nìkan",
  "pastQ.verifiedDesc": "Ìṣòro àkọ́kọ́ wà nínú àwọn akẹ́kọ́ ilé-ìwé rẹ àti apá tí ó pọ̀ mọ́.",
  "pastQ.academicDetails": "Àlàyé Ìmọ̀",
  "pastQ.academicDetailsHint": "Jẹ́ kí àwọn àlàyé yìí jẹ́ tọ̀ọ́ kí àwọn mìíràn lè rí ìgbàsílẹ̀ rẹ.",
  "pastQ.level": "Ipín",
  "pastQ.selectLevel": "Yan Ipín",
  "pastQ.courseCode": "Kòòdù Kọ́sì",
  "pastQ.courseCodePlaceholder": "bí. CSC 312",
  "pastQ.courseTitle": "Orúkọ Kọ́sì / Ahọn",
  "pastQ.courseTitlePlaceholder": "bí. Data Structures & Algorithms",
  "pastQ.academicSession": "Àgbègbè Ìmọ̀",
  "pastQ.selectSession": "Yan Àgbègbè",
  "pastQ.examSemester": "Àgbègbè Ìdánimọ̀",
  "pastQ.uploadFiles": "Gbé Fáìlù Sókè",
  "pastQ.uploadFilesHint": "Gbé fáìlù tí ó péye sókè. O lè gbé ọ̀pọ̀lọpọ̀ fáìlù sókè.",
  "pastQ.tapToUpload": "Tẹ̀ láti gbé fáìlù sókè",
  "pastQ.fileFormats": "JPG, PNG títí sí 10MB fún ọ̀kan",
  "pastQ.addMore": "Fi fáìlù mìíràn sí",
  "pastQ.disclaimerTitle": "Jọ̀wọ́ jẹ́ kí:",
  "pastQ.disclaimerBullet1": "Ìṣòro wà nínú ilé-ìwé rẹ.",
  "pastQ.disclaimerBullet2": "Ìgbàsílẹ̀ tí kò tọ́ tàbí tí kò tọ́ lè mu ìdènà sí i.",
  "pastQ.uploading": "Ń gbé sókè...",
  "pastQ.uploadButton": "Gbé Ìṣòro Àkọ́kọ́ Sókè",
  "pastQ.onlyInstitution": "Akẹ́kọ́ nínú ilé-ìwé rẹ nìkan lè wo ohun èlò yìí.",

  // ── Student Verification ─────────────────────────────────────
  "verification.title": "Ìdájọ́ Akẹ́kọ́",
  "verification.subtitle": "Jẹ́rìí ìdánilójú ilé-ìwé rẹ",
  "verification.studentId": "Káàdì Akẹ́kọ́",
  "verification.admissionLetter": "Ìwé Wíba",
  "verification.uploadId": "Gbé Káàdì Akẹ́kọ́ Sókè",
  "verification.uploadLetter": "Gbé Ìwé Wíba Sókè",
  "verification.confirmDocs": "Mo jẹ́rìí pé àwọn ìwé yìí jẹ́ ti mi",
  "verification.submit": "Fi sílẹ̀ Fun Ìdájọ́",
  "verification.submitting": "Ń fi sílẹ̀...",
  "verification.successMsg": "Àwọn ìwé rẹ ti fi sílẹ̀. Ìdájọ́ máa ń wá kéré ju ìgbà 24 sí i.",
  "verification.successTitle": "Ìdájọ́ Ti Bẹ̀rẹ̀",
  "verification.uploadAtLeast": "Jọ̀wọ́ gbé káàdì akẹ́kọ́ tàbí ìwé wíba kan sókè.",
  "verification.confirmDocuments": "Jọ̀wọ́ jẹ́rìí pé àwọn ìwé wà jẹ́ ti ọ.",

  // ── Errors ───────────────────────────────────────────────────
  "error.generic": "Ohunkóhun kò rí rọ̀rùn. Jọ̀wọ́ gbìyànjú sí i.",
  "error.network": "Kò sí ìsọ̀kan inthanetì. Jọ̀wọ́ ṣàyẹ̀wò ìsọ̀kan rẹ.",
  "error.unauthorized": "Ìgbà rẹ ti parí. Jọ̀wọ́ wọlé ọ̀kan sí i.",
  "error.notFound": "Ohun tí o ń wá kò sí.",
  "error.permission": "O kò ní ìyọ̀rọ̀ láti ṣe èyí.",
  "error.couldNotSend": "Kò lè ránṣẹ́. Jọ̀wọ́ gbìyànjú sí i.",
  "error.couldNotLoad": "Kò lè gbé dátà sókè. Jọ̀wọ́ gbìyànjú sí i.",
  "error.couldNotDelete": "Kò lè parẹ́. Jọ̀wọ́ gbìyànjú sí i.",
  "error.couldNotSave": "Kò lè fi pẹ̀lú. Jọ̀wọ́ gbìyànjú sí i.",
  "error.permissionDenied": "Ìyọ̀rọ̀ Kò Jẹ́",
  "error.error": "Ìṣòro",

  // ── Success ──────────────────────────────────────────────────
  "success.saved": "Ti fi pẹ̀lú ní ìṣẹ́gun",
  "success.sent": "Ti ránṣẹ́ ní ìṣẹ́gun",
  "success.deleted": "Ti parẹ́ ní ìṣẹ́gun",
  "success.updated": "Ti ṣe àtúnṣe ní ìṣẹ́gun",
  "success.copied": "Ti kọ̀ọ̀ sí kíbọ̀òdù",
  "success.success": "Ìṣẹ́gun",

  // ── Misc ─────────────────────────────────────────────────────
  "misc.today": "Òní",
  "misc.yesterday": "Àná",
  "misc.thisWeek": "Ọ̀sẹ̀ Yìí",
  "misc.older": "Àtijọ́",
  "misc.justNow": "Báyísí",
  "misc.minutesAgo": "Ìṣáájú {{count}} tí ó kọjá",
  "misc.hoursAgo": "Wákàtí {{count}} tí ó kọjá",
  "misc.daysAgo": "Àwọn ọjọ́ {{count}} tí wọ́n kọjá",
  "misc.giftReceived": "Gbíyànjú Ti Dé 🎁",
  "misc.giftSent": "{{name}} ránṣẹ́ gbíyànjú sí ọ!",
  "misc.levelUp": "O kọ ìpọ̀nwó sí i!",
  "misc.newFollower": "{{name}} bẹ̀rẹ̀ sí tẹ̀lẹ̀ ọ",
  "misc.comingSoon": "Ó ṣì wáyé",
  "misc.noResults": "Kò sí ìmúlò kankan",
  "misc.pullToRefresh": "Gbìyànjú láti ṣe tuntun",
  "misc.cancel": "Fagilee",
  "misc.tryAgain": "Gbìyànjú sí i",

  // ── Quick Actions ────────────────────────────────────────────
  "quickactions.title": "Iṣẹ́ Kì",
  "quickactions.leaderboard": "Ìṣòro",
  "quickactions.marketplace": "Ìjà",
  "quickactions.hostels": "Ilé",
  "quickactions.events": "Ìṣẹ̀lẹ̀",
  "quickactions.groups": "Ẹgbẹ́",
  "quickactions.achievement": "Ìṣẹ́gun",
  "quickactions.jobs": "Iṣẹ́",
  "quickactions.notes": "Àkọsílẹ̀ Mi",
  "quickactions.games": "Ere",
  "quickactions.aiTutor": "Olùkọ́ AI",
  "quickactions.elections": "Ìdìbò",
  "notes.failedToFetch": "Kò lè gbé àkọsílẹ̀ sókè láti síẹva.",
  "notes.failedToRefresh": "Kò lè tuntun àkọsílẹ̀ sí i.",
  "notes.failedToSave": "Kò lè fi àkọsílẹ̀ pẹ̀lú sí síẹva.",
  "notes.failedToPin": "Kò lè ṣe àtúnṣe ipo àmì.",
  "notes.failedToBookmark": "Kò lè ṣe àtúnṣe ipo àmì a faramọ̀.",
  "notes.failedToDelete": "Kò lè parẹ́ àkọsílẹ̀.",
  "notes.deleteNote": "Parẹ́ Àkọsílẹ̀",
  "notes.deleteConfirm": "Ṣe o dá lórí pé o fẹ́ parẹ́ àkọsílẹ̀ yìí?",
  "pastQ.selectOption": "Yan {{type}}",
  "pastQ.uploadSuccess": "Ìṣòro àkọ́kọ́ rẹ ti gbé sókè.",
  "pastQ.uploadSuccessful": "Ìgbàsílẹ̀ Ní Ìṣẹ́gun",
  "pastQ.failedToLoad": "Failed to load past questions.",
  "pastQ.noDownloadLink": "No download link available for this file.",
};

export default yo;

export type Locale = "ko" | "en";
export const DEFAULT_LOCALE: Locale = "ko";
export const LOCALE_COOKIE = "cellah_locale";

export interface Translations {
  common: {
    loading: string; save: string; cancel: string; submit: string; back: string;
    backHome: string; edit: string; delete: string; confirm: string; close: string;
    search: string; loadMore: string; empty: string; error: string;
  };
  header: {
    write: string; messages: string; notifications: string; admin: string;
    settings: string; logout: string; login: string; search: string; langSwitch: string; profile: string; guide: string;
  };
  footer: { privacy: string; terms: string; contact: string };
  nav: { home: string; cells: string; contents: string; mission: string; profile: string };
  comments: {
    title: string; prayerTitle: string; prayerNote: string; placeholder: string; post: string;
  };
  report: {
    button: string; reasonLabel: string; selectPlaceholder: string; submit: string; cancel: string;
    reasons: { spam: string; harmful: string; harassment: string; other: string };
    submitError: string;
  };
  userMenu: {
    mute: string; unmute: string; block: string; unblock: string; report: string;
    reportTitle: string; reportPlaceholder: string; reportSubmit: string;
    reportSuccess: string; reportError: string;
  };
  feed: { empty: string; loadError: string; composer: string; homeCta: string };
  notifications: { title: string; markAllRead: string; markedRead: string; empty: string; emptyDesc: string };
  bookmarks: { title: string; savedCount: string; empty: string; emptyDesc: string };
  reactions: { prayed: string; withYou: string; amen: string };
  settings: {
    title: string; profile: string; profileDesc: string; account: string; accountDesc: string;
    notificationsLabel: string; notificationsDesc: string; bookmarks: string; bookmarksDesc: string;
    language: string; languageDesc: string;
  };
  profile: {
    follow: string; unfollow: string; followers: string; following: string;
    posts: string; edit: string; noPosts: string;
  };
  onboarding: { title: string; desc: string; alreadyHaveAccount: string; signIn: string };
  home: {
    feedTab: string; prayerTab: string;
    dailyPrayer: string; prayTogether: string; viewPrayerBoard: string;
    followingPrayerSubtitle: string; myPrayers: string; addPrayer: string;
    feedError: string; prayerError: string;
  };
  write: {
    typePickerTitle: string; typePickerDesc: string; recommended: string; back: string;
    requestTypeLabel: string; requestTypeRequired: string;
    missionCountryLabel: string; missionCountryDefault: string;
    cellTopicLabel: string;
    youtubeLinkLabel: string; youtubeLinkWarning: string;
    titlePlaceholder: string;
    tagLabel: string; tagDesc: string; tagPlaceholder: string;
    publishing: string; publish: string;
    imageAttach: string; imageAttachDesc: string; selectPhoto: string;
    uploadPhoto: string; retry: string; uploading: string; uploadDone: string;
    removePhoto: string; previewAlt: string;
    postTypes: {
      general: { label: string; description: string; placeholder: string };
      prayer: { label: string; description: string; placeholder: string };
      cell: { label: string; description: string; placeholder: string };
      content: { label: string; description: string; placeholder: string };
      mission: { label: string; description: string; placeholder: string };
      testimony: { label: string; description: string; placeholder: string };
      request: { label: string; description: string; placeholder: string };
    };
    requestTypes: { shooting: string; editing: string; planning: string; education: string; collaboration: string };
  };
  postCard: {
    comment: string; commentLogin: string;
    dailyPrayer: string; testimony: string;
    shareLink: string; copied: string;
    readMore: string; bookmark: string; unbookmark: string; photoAlt: string;
  };
  profilePage: {
    backHome: string; editProfile: string;
    blocked: string; noPosts: string; noOwnPosts: string; writeFirst: string;
    noContents: string; noOwnContents: string; uploadContent: string;
    postsTab: string; contentsTab: string; crowTab: string; spiritualTab: string;
    loadError: string; notFound: string;
  };
}

const ko: Translations = {
  common: {
    loading: "로딩 중…", save: "저장", cancel: "취소", submit: "제출", back: "뒤로",
    backHome: "← 홈으로", edit: "수정", delete: "삭제", confirm: "확인", close: "닫기",
    search: "검색", loadMore: "더 보기", empty: "아직 내용이 없습니다.", error: "오류가 발생했습니다.",
  },
  header: {
    write: "✏️ 글쓰기", messages: "메시지", notifications: "알림", admin: "관리자",
    settings: "설정", logout: "로그아웃", login: "로그인", search: "검색", langSwitch: "EN", profile: "프로필", guide: "이용방법",
  },
  footer: { privacy: "개인정보처리방침", terms: "이용약관", contact: "문의" },
  nav: { home: "홈", cells: "셀", contents: "컨텐츠", mission: "선교", profile: "프로필" },
  comments: {
    title: "댓글", prayerTitle: "기도 응원",
    prayerNote: "기도 게시글에는 댓글을 달 수 없습니다. 반응으로 함께 기도해주세요.",
    placeholder: "댓글을 입력하세요… @이름 으로 멘션할 수 있습니다", post: "작성",
  },
  report: {
    button: "신고", reasonLabel: "신고 사유", selectPlaceholder: "사유 선택…",
    submit: "제출", cancel: "취소",
    reasons: { spam: "스팸", harmful: "유해하거나 위험한 내용", harassment: "괴롭힘", other: "기타" },
    submitError: "신고 제출에 실패했습니다.",
  },
  userMenu: {
    mute: "뮤트", unmute: "뮤트 해제", block: "차단", unblock: "차단 해제",
    report: "신고하기", reportTitle: "신고", reportPlaceholder: "신고 사유 (선택)",
    reportSubmit: "신고 제출", reportSuccess: "신고가 접수되었습니다.", reportError: "신고 제출에 실패했습니다.",
  },
  feed: {
    empty: "아직 팔로우한 사람의 글이 없습니다.", loadError: "피드를 불러올 수 없습니다.",
    composer: "지금 나누고 싶은 것을 작성해보세요.", homeCta: "오늘 하나님께서 주신 말씀이나 기도제목을 나눠보세요.",
  },
  notifications: {
    title: "알림", markAllRead: "모두 읽음", markedRead: "모두 읽음 처리됐습니다.", empty: "아직 알림이 없습니다.",
    emptyDesc: "누군가 팔로우하거나 게시글에 반응하면 여기에 표시됩니다.",
  },
  bookmarks: {
    title: "저장한 글", savedCount: "개 저장됨", empty: "저장된 글이 없습니다.",
    emptyDesc: "북마크 아이콘을 눌러 나중에 읽고 싶은 글을 저장해보세요.",
  },
  reactions: { prayed: "기도했어요", withYou: "함께해요", amen: "아멘" },
  settings: {
    title: "설정", profile: "프로필 수정", profileDesc: "이름, 소개, 사진 변경",
    account: "계정 관리", accountDesc: "이메일, 계정 삭제",
    notificationsLabel: "알림 설정", notificationsDesc: "알림 종류 및 빈도 설정",
    bookmarks: "저장한 게시글", bookmarksDesc: "북마크한 게시글 모아보기",
    language: "언어", languageDesc: "앱 표시 언어를 변경합니다",
  },
  profile: {
    follow: "팔로우", unfollow: "팔로잉", followers: "팔로워", following: "팔로잉",
    posts: "게시글", edit: "프로필 수정", noPosts: "게시글이 없습니다.",
  },
  onboarding: {
    title: "가입 신청",
    desc: "정보를 입력하고 관리자의 승인을 기다려주세요. 승인 후 이메일로 가입 링크를 보내드립니다.",
    alreadyHaveAccount: "이미 계정이 있으신가요?", signIn: "로그인",
  },
  home: {
    feedTab: "피드", prayerTab: "기도",
    dailyPrayer: "오늘의 기도", prayTogether: "함께 기도하기 →", viewPrayerBoard: "기도 게시판 보기 →",
    followingPrayerSubtitle: "팔로우한 사람들의 기도 제목", myPrayers: "내 기도", addPrayer: "+ 기도 제목",
    feedError: "피드를 불러올 수 없습니다.", prayerError: "기도 제목을 불러올 수 없습니다.",
  },
  write: {
    typePickerTitle: "무엇을 나누실 건가요?", typePickerDesc: "게시글 종류를 선택하세요", recommended: "추천", back: "← 뒤로",
    requestTypeLabel: "요청 유형", requestTypeRequired: "요청 유형을 선택해주세요.",
    missionCountryLabel: "선교 국가", missionCountryDefault: "국가 선택 (선택사항)",
    cellTopicLabel: "토픽 연결",
    youtubeLinkLabel: "유튜브 링크", youtubeLinkWarning: "유튜브 링크가 아닐 수 있어요. 계속 진행하셔도 됩니다.",
    titlePlaceholder: "제목 (선택사항)",
    tagLabel: "태그", tagDesc: "(쉼표로 구분, 최대 5개)", tagPlaceholder: "예) 묵상, 기도, 감사",
    publishing: "게시 중…", publish: "게시하기",
    imageAttach: "사진 첨부", imageAttachDesc: "(선택, JPG·PNG·WEBP, 최대 5MB)", selectPhoto: "사진 선택",
    uploadPhoto: "사진 업로드", retry: "다시 시도", uploading: "업로드 중…", uploadDone: "✓ 업로드 완료",
    removePhoto: "사진 제거", previewAlt: "미리보기",
    postTypes: {
      general: { label: "일반", description: "일상, 묵상, 나눔 등 자유롭게", placeholder: "오늘 하루 나누고 싶은 이야기를 써주세요." },
      prayer: { label: "기도 제목", description: "함께 기도해 주세요", placeholder: "기도 제목을 나눠주세요. 함께 기도하겠습니다." },
      cell: { label: "셀 나눔", description: "셀 모임 나눔과 소식", placeholder: "셀 모임에서 나눈 이야기를 적어주세요." },
      content: { label: "컨텐츠", description: "유튜브 영상, 설교, 강의 공유", placeholder: "소개하고 싶은 컨텐츠를 설명해주세요." },
      mission: { label: "선교 업데이트", description: "선교 현장 소식과 기도 요청", placeholder: "선교 현장의 소식을 전해주세요." },
      testimony: { label: "간증", description: "하나님의 일하심을 나눠요", placeholder: "하나님께서 하신 일을 나눠주세요." },
      request: { label: "제작 요청", description: "촬영·편집·기획 협업 요청", placeholder: "첫 줄에 요청 제목을 써주세요.\n\n어떤 도움이 필요한지 구체적으로 설명해주세요.\n예) 선교지 영상을 편집해주실 분을 찾고 있습니다." },
    },
    requestTypes: { shooting: "📷 촬영 도움", editing: "✂️ 편집 도움", planning: "📋 기획 도움", education: "📚 교육/질문", collaboration: "🤝 협업 제안" },
  },
  postCard: {
    comment: "댓글", commentLogin: "댓글을 달려면 로그인하세요",
    dailyPrayer: "오늘의 기도", testimony: "간증",
    shareLink: "링크 복사", copied: "복사됨!",
    readMore: "더 보기", bookmark: "북마크 추가", unbookmark: "북마크 해제", photoAlt: "첨부 사진",
  },
  profilePage: {
    backHome: "← 홈", editProfile: "프로필 수정",
    blocked: "이 사용자를 차단했습니다.", noPosts: "아직 게시글이 없습니다", noOwnPosts: "아직 작성한 글이 없습니다", writeFirst: "첫 글 작성하기",
    noContents: "아직 콘텐츠가 없습니다", noOwnContents: "아직 올린 콘텐츠가 없습니다", uploadContent: "콘텐츠 올리기",
    postsTab: "게시글", contentsTab: "콘텐츠", crowTab: "까마귀", spiritualTab: "영성",
    loadError: "프로필을 불러올 수 없습니다", notFound: "존재하지 않는 사용자이거나 오류가 발생했습니다.",
  },
};

const en: Translations = {
  common: {
    loading: "Loading…", save: "Save", cancel: "Cancel", submit: "Submit", back: "Back",
    backHome: "← Home", edit: "Edit", delete: "Delete", confirm: "Confirm", close: "Close",
    search: "Search", loadMore: "Load more", empty: "Nothing here yet.", error: "Something went wrong.",
  },
  header: {
    write: "✏️ Write", messages: "Messages", notifications: "Notifications", admin: "Admin",
    settings: "Settings", logout: "Log out", login: "Log in", search: "Search", langSwitch: "한", profile: "Profile", guide: "How to Use",
  },
  footer: { privacy: "Privacy", terms: "Terms", contact: "Contact" },
  nav: { home: "Home", cells: "Cells", contents: "Contents", mission: "Mission", profile: "Profile" },
  comments: {
    title: "Comments", prayerTitle: "Prayer Support",
    prayerNote: "Comments are disabled for prayer posts. React to pray together.",
    placeholder: "Write a comment… mention with @name", post: "Post",
  },
  report: {
    button: "Report", reasonLabel: "Reason", selectPlaceholder: "Select…",
    submit: "Submit", cancel: "Cancel",
    reasons: { spam: "Spam", harmful: "Harmful or unsafe", harassment: "Harassment", other: "Other" },
    submitError: "Failed to submit report.",
  },
  userMenu: {
    mute: "Mute user", unmute: "Unmute user", block: "Block user", unblock: "Unblock user",
    report: "Report user", reportTitle: "Report", reportPlaceholder: "Reason (optional)",
    reportSubmit: "Submit report", reportSuccess: "Report submitted.", reportError: "Failed to submit report.",
  },
  feed: {
    empty: "No posts from people you follow yet.", loadError: "Failed to load feed.",
    composer: "Share what's on your heart.", homeCta: "Share a verse, prayer request, or testimony today.",
  },
  notifications: {
    title: "Notifications", markAllRead: "Mark all read", markedRead: "Marked as read.", empty: "No notifications yet.",
    emptyDesc: "You'll see notifications here when someone follows you or reacts to your posts.",
  },
  bookmarks: {
    title: "Saved posts", savedCount: " saved", empty: "No saved posts.",
    emptyDesc: "Tap the bookmark icon to save posts for later.",
  },
  reactions: { prayed: "Prayed", withYou: "With you", amen: "Amen" },
  settings: {
    title: "Settings", profile: "Edit profile", profileDesc: "Name, bio, photo",
    account: "Account", accountDesc: "Email, delete account",
    notificationsLabel: "Notifications", notificationsDesc: "Notification types and frequency",
    bookmarks: "Saved posts", bookmarksDesc: "View your bookmarked posts",
    language: "Language", languageDesc: "Change the display language",
  },
  profile: {
    follow: "Follow", unfollow: "Following", followers: "Followers", following: "Following",
    posts: "Posts", edit: "Edit profile", noPosts: "No posts yet.",
  },
  onboarding: {
    title: "Request access",
    desc: "Submit your details. An admin will review your request and send you an email with a signup link.",
    alreadyHaveAccount: "Already have an account?", signIn: "Sign in",
  },
  home: {
    feedTab: "Feed", prayerTab: "Prayer",
    dailyPrayer: "Today's Prayer", prayTogether: "Pray together →", viewPrayerBoard: "View prayer board →",
    followingPrayerSubtitle: "Prayer requests from people you follow", myPrayers: "My Prayers", addPrayer: "+ Prayer",
    feedError: "Failed to load feed.", prayerError: "Failed to load prayers.",
  },
  write: {
    typePickerTitle: "What would you like to share?", typePickerDesc: "Select a post type", recommended: "Recommended", back: "← Back",
    requestTypeLabel: "Request type", requestTypeRequired: "Please select a request type.",
    missionCountryLabel: "Mission country", missionCountryDefault: "Select country (optional)",
    cellTopicLabel: "Connect topic",
    youtubeLinkLabel: "YouTube link", youtubeLinkWarning: "This may not be a YouTube link. You can proceed.",
    titlePlaceholder: "Title (optional)",
    tagLabel: "Tags", tagDesc: "(comma-separated, max 5)", tagPlaceholder: "e.g. devotion, prayer, gratitude",
    publishing: "Publishing…", publish: "Publish",
    imageAttach: "Attach photo", imageAttachDesc: "(optional, JPG·PNG·WEBP, max 5MB)", selectPhoto: "Select photo",
    uploadPhoto: "Upload photo", retry: "Retry", uploading: "Uploading…", uploadDone: "✓ Upload complete",
    removePhoto: "Remove photo", previewAlt: "Preview",
    postTypes: {
      general: { label: "General", description: "Daily life, devotion, sharing", placeholder: "Share something from your day." },
      prayer: { label: "Prayer request", description: "Let us pray with you", placeholder: "Share your prayer request. We'll pray together." },
      cell: { label: "Cell sharing", description: "Cell group news and sharing", placeholder: "Write about what was shared in your cell group." },
      content: { label: "Content", description: "YouTube videos, sermons, lectures", placeholder: "Describe the content you want to share." },
      mission: { label: "Mission update", description: "News and prayers from the mission field", placeholder: "Share news from the mission field." },
      testimony: { label: "Testimony", description: "Share how God has been working", placeholder: "Share what God has done." },
      request: { label: "Production request", description: "Filming · editing · planning collaboration", placeholder: "Write the request title on the first line.\n\nDescribe specifically what help you need.\ne.g. I'm looking for someone to edit a mission field video." },
    },
    requestTypes: { shooting: "📷 Filming help", editing: "✂️ Editing help", planning: "📋 Planning help", education: "📚 Education/Q&A", collaboration: "🤝 Collaboration" },
  },
  postCard: {
    comment: "Comments", commentLogin: "Log in to comment",
    dailyPrayer: "Today's Prayer", testimony: "Testimony",
    shareLink: "Copy link", copied: "Copied!",
    readMore: "Read more", bookmark: "Bookmark", unbookmark: "Remove bookmark", photoAlt: "Attached photo",
  },
  profilePage: {
    backHome: "← Home", editProfile: "Edit profile",
    blocked: "You have blocked this user.", noPosts: "No posts yet", noOwnPosts: "No posts yet", writeFirst: "Write your first post",
    noContents: "No content yet", noOwnContents: "No content uploaded yet", uploadContent: "Upload content",
    postsTab: "Posts", contentsTab: "Contents", crowTab: "Crow", spiritualTab: "Spiritual",
    loadError: "Failed to load profile", notFound: "User not found or an error occurred.",
  },
};

export const translations: Record<Locale, Translations> = { ko, en };

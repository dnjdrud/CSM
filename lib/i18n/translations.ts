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
    settings: string; logout: string; login: string; search: string; langSwitch: string;
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
  notifications: { title: string; markAllRead: string; empty: string; emptyDesc: string };
  bookmarks: { title: string; empty: string; emptyDesc: string };
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
}

const ko: Translations = {
  common: {
    loading: "로딩 중…", save: "저장", cancel: "취소", submit: "제출", back: "뒤로",
    backHome: "← 홈으로", edit: "수정", delete: "삭제", confirm: "확인", close: "닫기",
    search: "검색", loadMore: "더 보기", empty: "아직 내용이 없습니다.", error: "오류가 발생했습니다.",
  },
  header: {
    write: "✏️ 글쓰기", messages: "메시지", notifications: "알림", admin: "관리자",
    settings: "설정", logout: "로그아웃", login: "로그인", search: "검색", langSwitch: "EN",
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
    title: "알림", markAllRead: "모두 읽음", empty: "아직 알림이 없습니다.",
    emptyDesc: "누군가 팔로우하거나 게시글에 반응하면 여기에 표시됩니다.",
  },
  bookmarks: {
    title: "저장한 글", empty: "저장된 글이 없습니다.",
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
};

const en: Translations = {
  common: {
    loading: "Loading…", save: "Save", cancel: "Cancel", submit: "Submit", back: "Back",
    backHome: "← Home", edit: "Edit", delete: "Delete", confirm: "Confirm", close: "Close",
    search: "Search", loadMore: "Load more", empty: "Nothing here yet.", error: "Something went wrong.",
  },
  header: {
    write: "✏️ Write", messages: "Messages", notifications: "Notifications", admin: "Admin",
    settings: "Settings", logout: "Log out", login: "Log in", search: "Search", langSwitch: "한",
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
    title: "Notifications", markAllRead: "Mark all read", empty: "No notifications yet.",
    emptyDesc: "You'll see notifications here when someone follows you or reacts to your posts.",
  },
  bookmarks: {
    title: "Saved posts", empty: "No saved posts.",
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
};

export const translations: Record<Locale, Translations> = { ko, en };

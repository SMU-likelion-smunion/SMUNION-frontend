// firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/11.4.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging-compat.js"
);

// Firebase 초기화
firebase.initializeApp({
  apiKey: "AIzaSyBoT57SvBZMj2Xa5DOT-vMfp4dRZyR2YfA",
  authDomain: "smunion-5300c.firebaseapp.com",
  projectId: "smunion-5300c",
  storageBucket: "smunion-5300c.firebasestorage.app",
  messagingSenderId: "613158624793",
  appId: "1:613158624793:web:843f05069e401a0302d488",
  measurementId: "G-XKKWN7H8B9",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log("백그라운드 메시지 수신:", payload);

  // 공지 데이터 추출
  const data = payload.data || {};
  const notification = payload.notification || {};

  // 공지 유형 매핑
  const noticeTypeMap = {
    basic: {
      name: "일반공지",
      icon: "/assets/icons/notice-basic.svg",
      url: (id) => `notice-view-default.html?id=${id}`,
    },
    attendance: {
      name: "출석공지",
      icon: "/assets/icons/notice-attendance.svg",
      url: (id) => `notice-view-attendance.html?id=${id}`,
    },
    fee: {
      name: "회비공지",
      icon: "/assets/icons/notice-fee.svg",
      url: (id) => `notice-view-fee.html?id=${id}`,
    },
    vote: {
      name: "투표공지",
      icon: "/assets/icons/notice-vote.svg",
      url: (id) => `notice-view-vote.html?id=${id}`,
    },
  };

  // 공지 유형 확인
  const noticeType = data.noticeType || "basic";
  const typeInfo = noticeTypeMap[noticeType] || noticeTypeMap.basic;

  // 알림 제목 구성
  let title = notification.title || "새 공지가 등록되었습니다";
  if (data.department) {
    title = `[${data.department}] ${title}`;
  }

  // 알림 내용 구성
  let bodyParts = [];
  if (typeInfo.name) bodyParts.push(`[${typeInfo.name}]`);
  if (data.author) bodyParts.push(`작성자: ${data.author}`);
  if (data.title) bodyParts.push(`제목: ${data.title}`);

  // 공지 유형별 추가 정보
  switch (noticeType) {
    case "fee":
      if (data.amount) bodyParts.push(`금액: ${data.amount}원`);
      if (data.deadline) {
        const deadline = new Date(data.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        bodyParts.push(
          `납부기한: ${diffDays > 0 ? `${diffDays}일 남음` : "기한 지남"}`
        );
      }
      break;
    case "attendance":
      if (data.date) {
        const date = new Date(data.date);
        bodyParts.push(`일시: ${date.toLocaleDateString()}`);
      }
      break;
    case "vote":
      if (data.deadline) {
        const deadline = new Date(data.deadline);
        const today = new Date();
        const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));
        bodyParts.push(
          `투표기한: ${diffDays > 0 ? `${diffDays}일 남음` : "마감됨"}`
        );
      }
      break;
  }

  if (data.content) {
    // 내용이 길면 일부만 표시
    const contentPreview =
      data.content.length > 30
        ? data.content.substring(0, 30) + "..."
        : data.content;
    bodyParts.push(`내용: ${contentPreview}`);
  }

  // 알림 본문 구성
  const body = notification.body || bodyParts.join("\n");

  // 알림에 표시할 아이콘
  const icon = typeInfo.icon || "/assets/icons/smunion.svg";

  // 알림 클릭 시 이동할 URL 구성
  const noticeId = data.noticeId || "";
  const baseUrl =
    self.registration.scope || "https://smunion.store/html/pages/";
  const url = data.url || `${baseUrl}${typeInfo.url(noticeId)}`;

  // 알림 옵션 구성
  const notificationOptions = {
    body: body,
    icon: icon,
    badge: "/assets/icons/badge-icon.png",
    tag: `smunion-${noticeType}-${noticeId || Date.now()}`,
    data: {
      noticeType: noticeType,
      noticeId: noticeId,
      url: url,
      ...data,
    },
    actions: [
      {
        action: "view",
        title: "바로가기",
      },
    ],
    vibrate: [100, 50, 100],
    importance: "high",
    silent: false,
  };

  // 알림 표시
  self.registration.showNotification(title, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener("notificationclick", (event) => {
  // 알림 닫기
  event.notification.close();

  // 대상 URL 설정
  let urlToOpen;

  if (event.action === "view") {
    // 바로가기 액션 클릭시
    urlToOpen = event.notification.data.url;
  } else {
    // 알림 본문 클릭시
    urlToOpen = event.notification.data.url;
  }

  // URL이 유효한지 확인
  if (!urlToOpen || urlToOpen === "") {
    urlToOpen = "https://smunion.store/html/pages/notice-all.html";
  }

  // 열린 창 확인 후 포커스 또는 새 창 열기
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // 이미 열려있는 탭이 있는지 확인
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        // URL이 일치하거나 같은 도메인인 경우 해당 탭에 포커스
        if (client.url === urlToOpen || client.url.includes("smunion.store")) {
          return client.navigate(urlToOpen).then((client) => client.focus());
        }
      }

      // 열려있는 탭이 없으면 새 탭 열기
      return clients.openWindow(urlToOpen);
    })
  );
});

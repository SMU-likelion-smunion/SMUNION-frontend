// firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js"
);

// Firebase 구성 - 웹 클라이언트와 동일한 설정 사용
firebase.initializeApp({
  apiKey: "AIzaSyBoT57SvBZMj2Xa5DOT-vMfp4dRZyR2YfA",
  authDomain: "smunion-5300c.firebaseapp.com",
  projectId: "smunion-5300c",
  storageBucket: "smunion-5300c.firebasestorage.app",
  messagingSenderId: "613158624793",
  appId: "1:613158624793:web:843f05069e401a0302d488",
});

const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log("백그라운드 메시지 수신:", payload);

  const notificationTitle = payload.notification.title || "새 알림";
  const notificationOptions = {
    body: payload.notification.body || "",
    icon: "/assets/icons/smunion.svg",
    badge: "/assets/icons/badge-icon.png", // 모바일 알림 배지 아이콘 : 나중에 수정할 것
    data: payload.data, // 추가 데이터
    tag: "smunion-notification", // 알림 그룹화 (선택사항)
    // 클릭 시 열릴 URL
    data: {
      url: "https://smunion.store/html/pages/notice-all.html",
    },
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 이벤트 처리
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // 알림 클릭 시 특정 페이지로 이동
  const urlToOpen =
    event.notification.data?.url ||
    "https://smunion.store/html/pages/notice-all.html";

  event.waitUntil(
    clients.matchAll({ type: "window" }).then((windowClients) => {
      // 이미 열려있는 탭이 있는지 확인
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }

      // 열려있는 탭이 없으면 새 탭 열기
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

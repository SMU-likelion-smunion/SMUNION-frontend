// fcm-init.js
document.addEventListener("DOMContentLoaded", async function () {
  const API_SERVER_DOMAIN = "https://smunion.shop";

  // 쿠키 관련 함수
  function getCookie(name) {
    const nameEQ = name + "=";
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      let cookie = cookies[i].trim();
      if (cookie.indexOf(nameEQ) === 0) {
        return cookie.substring(nameEQ.length, cookie.length);
      }
    }
    return null;
  }

  // 로그인 상태 확인
  const accessToken = getCookie("accessToken");
  if (!accessToken) {
    // 로그인 페이지가 아니라면 로그인 페이지로 리디렉션
    if (!window.location.href.includes("login.html")) {
      window.location.href = "/html/pages/login.html";
    }
    return;
  }

  try {
    // Firebase SDK 동적 로드
    await loadFirebaseModules();

    // Firebase 초기화 및 FCM 설정
    await initializeFCM();
  } catch (error) {
    console.error("Firebase 초기화 오류:", error);
  }

  // Firebase SDK 모듈 동적 로드
  async function loadFirebaseModules() {
    return new Promise((resolve, reject) => {
      // Firebase App 스크립트 로드
      const appScript = document.createElement("script");
      appScript.type = "module";
      appScript.textContent = `
        import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
        import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-messaging.js";
        
        // Firebase 구성
        const firebaseConfig = {
          apiKey: "AIzaSyBoT57SvBZMj2Xa5DOT-vMfp4dRZyR2YfA",
          authDomain: "smunion-5300c.firebaseapp.com",
          projectId: "smunion-5300c",
          storageBucket: "smunion-5300c.firebasestorage.app",
          messagingSenderId: "613158624793",
          appId: "1:613158624793:web:843f05069e401a0302d488",
          measurementId: "G-XKKWN7H8B9"
        };
        
        // Firebase 초기화
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        // 전역 변수로 할당하여 다른 함수에서 접근 가능하게 함
        window.firebaseMessaging = {
          getToken: (options) => getToken(messaging, options),
          onMessage: (callback) => onMessage(messaging, callback)
        };
        
        document.dispatchEvent(new Event('firebaseLoaded'));
      `;

      document.head.appendChild(appScript);

      // Firebase 모듈 로드 완료 이벤트 감지
      document.addEventListener("firebaseLoaded", resolve);

      // 10초 후에도 로드되지 않으면 타임아웃 처리
      setTimeout(() => {
        reject(new Error("Firebase 모듈 로드 시간 초과"));
      }, 10000);
    });
  }

  // Firebase Messaging 초기화
  async function initializeFCM() {
    try {
      // Firebase가 로드될 때까지 기다림
      if (typeof window.firebaseMessaging === "undefined") {
        await new Promise((resolve) => {
          const checkFirebase = () => {
            if (window.firebaseMessaging) {
              resolve();
            } else {
              setTimeout(checkFirebase, 100);
            }
          };
          checkFirebase();
        });
      }

      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.log("알림 권한이 거부되었습니다.");
        return;
      }

      // 서비스 워커 등록
      const registration = await navigator.serviceWorker.register(
        "/firebase-messaging-sw.js"
      );
      console.log("서비스 워커가 등록되었습니다:", registration.scope);

      // FCM 토큰 요청
      try {
        const currentToken = await window.firebaseMessaging.getToken({
          vapidKey:
            "BKxLz-RRAExybC4CQdZqQ6GSt9B-yOZFh_XKxjelr-Rx9OSixDRv9qlqzTAoBjcEYcnc5rpRBQgzx1Lc7NbOi_E",
          serviceWorkerRegistration: registration,
        });

        if (currentToken) {
          console.log("FCM 토큰:", currentToken);
          // 서버에 토큰 등록
          await registerTokenToServer(currentToken);
        } else {
          console.log("토큰을 가져올 수 없습니다.");
        }
      } catch (error) {
        console.error("토큰 가져오기 오류:", error);
      }

      // 포그라운드 메시지 수신 핸들러
      window.firebaseMessaging.onMessage((payload) => {
        console.log("포그라운드 메시지 수신:", payload);

        // 포그라운드에서 알림 표시
        if (Notification.permission === "granted") {
          // 공지 유형 매핑
          const noticeTypeMap = {
            basic: "일반공지",
            attendance: "출석공지",
            fee: "회비공지",
            vote: "투표공지",
          };

          const data = payload.data || {};
          const noticeType = data.noticeType || "basic";
          const typeText = noticeTypeMap[noticeType] || "";

          // 제목과 내용 구성
          let title = payload.notification?.title || "새 공지가 등록되었습니다";
          if (typeText) {
            title = `[${typeText}] ${title}`;
          }

          const notificationOptions = {
            body: payload.notification?.body || "",
            icon: "/assets/icons/smunion.svg",
            data: payload.data,
            tag: `smunion-${noticeType}-${data.noticeId || Date.now()}`,
          };

          // 브라우저 알림 표시
          const notification = new Notification(title, notificationOptions);

          // 알림 클릭 이벤트
          notification.onclick = function () {
            // 알림 클릭 시 해당 페이지로 이동
            const noticeId = data.noticeId;
            let url = "/html/pages/notice-all.html";

            if (noticeId) {
              switch (noticeType) {
                case "basic":
                  url = `/html/pages/notice-view-default.html?id=${noticeId}`;
                  break;
                case "attendance":
                  url = `/html/pages/notice-view-attendance.html?id=${noticeId}`;
                  break;
                case "fee":
                  url = `/html/pages/notice-view-fee.html?id=${noticeId}`;
                  break;
                case "vote":
                  url = `/html/pages/notice-view-vote.html?id=${noticeId}`;
                  break;
              }
            }

            window.focus();
            window.location.href = url;
          };
        }
      });

      console.log("FCM이 성공적으로 초기화되었습니다");
    } catch (error) {
      console.error("FCM 초기화 중 오류 발생:", error);
    }
  }

  // 토큰을 서버에 등록하는 함수

  async function registerTokenToServer(token) {
    try {
      // 이미 저장된 토큰과 동일한지 확인
      const savedToken = localStorage.getItem("fcmToken");

      // 토큰이 동일하면 다시 등록하지 않음
      if (savedToken === token) {
        console.log("이미 등록된 FCM 토큰을 재사용합니다.");
        return;
      }

      const response = await fetch(
        `${API_SERVER_DOMAIN}/api/v1/notices/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            fcmToken: token,
          }),
        }
      );

      const data = await response.json();

      // 성공 또는 "이미 존재" 메시지는 둘 다 정상으로 처리
      if (
        data.isSuccess ||
        data.message === "해당 유저의 FCM 토큰이 이미 존재합니다."
      ) {
        console.log("FCM 토큰 서버 등록 완료");
        // 로컬 스토리지에 토큰 저장
        localStorage.setItem("fcmToken", token);
      } else {
        console.error("FCM 토큰 서버 등록 실패:", data.message);
      }
    } catch (error) {
      console.error("FCM 토큰 서버 등록 중 오류:", error);
    }
  }
});

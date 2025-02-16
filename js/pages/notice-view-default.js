// notice-view-default.js
const BASE_URL = "https://smunion.shop";

// 쿠키에서 토큰 가져오기
function getToken() {
  const cookies = document.cookie.split(";");
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split("=");
    if (name === "accessToken") {
      return value;
    }
  }
  return null;
}

// URL에서 ID 파라미터 가져오기
function getNoticeId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

// 날짜 포맷팅
function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
}

// 남은 일수 계산
function calculateRemainingDays(dateStr) {
  const targetDate = new Date(dateStr);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays}일 남음` : "기한 지남";
}

// 공지사항 데이터 불러오기
async function loadNoticeDetail() {
  const noticeId = getNoticeId();
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(
      `${BASE_URL}/api/v1/notices/basic/${noticeId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(data.message);
    }

    displayNoticeDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("공지사항을 불러오는데 실패했습니다.");
  }
}

// 공지사항 내용 표시
function displayNoticeDetail(notice) {
  document.querySelector(".notice-title").textContent = notice.title;
  document.querySelector(".notice-desc").textContent = notice.content;
  document.querySelector(".target").textContent = `대상: ${notice.target}`;
  document.querySelector(".date").textContent = formatDate(notice.date);
  document.querySelector(".tag").textContent = calculateRemainingDays(
    notice.date
  );
}

// 이벤트 핸들러 설정
function setupEventHandlers(notice) {
  // 뒤로가기 버튼
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 현황 버튼
  document.querySelector(".status-btn").addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/basic/${notice.noticeId}/unread`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.isSuccess) {
        // 현황 정보를 표시하는 모달이나 새 페이지로 이동
        alert(`미확인 인원: ${data.result.unreadMembers.length}명`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("현황을 불러오는데 실패했습니다.");
    }
  });

  // 확인 완료 버튼
  document.querySelector(".submit-btn").addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/basic/${notice.noticeId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.isSuccess) {
        alert("확인 완료되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("확인 처리에 실패했습니다.");
    }
  });
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadNoticeDetail);

const BASE_URL = "https://smunion.shop";

// 토큰
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

// 공지사항 불러오기
async function fetchNotices() {
  try {
    const accessToken = getToken();
    if (!accessToken) {
      window.location.href = "login.html";
      return;
    }

    // 타입별 호출
    const [basicResponse, voteResponse, feeResponse, attendanceResponse] =
      await Promise.all([
        fetch(`${BASE_URL}/api/v1/notices/basic`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${BASE_URL}/api/v1/notices/votes`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${BASE_URL}/api/v1/notices/fees`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`${BASE_URL}/api/v1/notices/attendance`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

    // 각 응답을 JSON으로 변환
    const [basicData, voteData, feeData, attendanceData] = await Promise.all([
      basicResponse.json(),
      voteResponse.json(),
      feeResponse.json(),
      attendanceResponse.json(),
    ]);

    // 응답 데이터 처리
    const notices = [];

    // 일반 공지사항
    if (basicData.isSuccess && basicData.result.notices) {
      basicData.result.notices.forEach((notice) => {
        notices.push({
          category: "공지",
          ...transformNotice(notice),
        });
      });
    }

    // 투표 공지
    if (voteData.isSuccess && voteData.result.votes) {
      voteData.result.votes.forEach((vote) => {
        notices.push({
          category: "투표",
          ...transformNotice(vote, "vote"),
        });
      });
    }

    // 회비 공지
    if (feeData.isSuccess && feeData.result.fees) {
      feeData.result.fees.forEach((fee) => {
        notices.push({
          category: "회비",
          ...transformNotice(fee, "fee"),
        });
      });
    }

    // 출석 공지
    if (attendanceData.isSuccess && attendanceData.result.attendances) {
      attendanceData.result.attendances.forEach((attendance) => {
        notices.push({
          category: "출석",
          ...transformNotice(attendance, "attendance"),
        });
      });
    }

    // 날짜순 정ㅕ렬
    notices.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    displayNotices(notices);
  } catch (error) {
    console.error("Error:", error);
    alert("공지사항을 불러오는데 실패했습니다. 다시 시도해주세요.");
  }
}

// 공지사항 데이터 변환
function transformNotice(notice, type = "basic") {
  const baseData = {
    id: notice.noticeId || notice.voteId || notice.feeId || notice.attendanceId,
    title: notice.title,
    description: notice.content,
    date: formatDate(notice.createdAt),
    createdAt: notice.createdAt,
  };

  // 타입별 추가 데이터
  switch (type) {
    case "vote":
      baseData.remainingDays = calculateRemainingDays(notice.date);
      baseData.status = new Date(notice.date) < new Date() ? "over" : "active";
      break;
    case "fee":
      baseData.remainingDays = calculateRemainingDays(notice.deadline);
      baseData.status =
        new Date(notice.deadline) < new Date() ? "over" : "active";
      break;
    case "attendance":
      baseData.remainingDays = calculateRemainingDays(notice.date);
      baseData.status = new Date(notice.date) < new Date() ? "over" : "active";
      break;
    default:
      baseData.remainingDays = calculateRemainingDays(notice.date);
      baseData.status = new Date(notice.date) < new Date() ? "over" : "active";
  }

  return baseData;
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
function calculateRemainingDays(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const today = new Date();
  const diffTime = deadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// 공지사항 화면에 표시
function displayNotices(notices) {
  const noticeList = document.querySelector(".notice-list");
  noticeList.innerHTML = ""; // 기존 내용 초기화

  notices.forEach((notice) => {
    const noticeElement = createNoticeElement(notice);
    noticeList.appendChild(noticeElement);
  });
}

// 공지사항 요소 생성
function createNoticeElement(notice) {
  const div = document.createElement("div");
  div.className = "notice-item";

  let statusTag = "";
  if (notice.status === "over") {
    statusTag = '<span class="notice-tag over">기한지남</span>';
  } else {
    statusTag = `<span class="notice-tag">${notice.remainingDays}일 남음</span>`;
  }

  div.innerHTML = `
        <h2 class="notice-category">${notice.category}</h2>
        <h3 class="notice-subtitle">${notice.title}</h3>
        ${
          notice.description
            ? `<p class="notice-desc">${notice.description}</p>`
            : ""
        }
        <div class="notice-info">
            <span class="notice-date">${notice.date}</span>
            ${statusTag}
        </div>
    `;

  // 클릭 이벤트 리스너
  div.addEventListener("click", () => {
    handleNoticeClick(notice);
  });

  return div;
}


function handleNoticeClick(notice) {
  // 각 카테고리별 상세 페이지로 이동
  switch (notice.category) {
    case "투표":
      window.location.href = `notice-view-vote.html?id=${notice.id}`;
      break;
    case "회비":
      window.location.href = `notice-view-fee.html?id=${notice.id}`;
      break;
    case "출석":
      window.location.href = `notice-view-attendance.html?id=${notice.id}`;
      break;
    case "공지":
      window.location.href = `notice-view-default.html?id=${notice.id}`;
      break;
  }
}

// 탭 메뉴 이벤트 처리
function initializeTabMenu() {
  const tabButtons = document.querySelectorAll(".tab-menu button");

  tabButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // 활성 탭 스타일 변경
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // 카테고리별 필터링
      const category = button.dataset.category;
      filterNoticesByCategory(category);
    });
  });
}


// 공지 생성 버튼 연결
function initializeFloatingButton() {
  const floatingBtn = document.querySelector(".floating-btn");
  if (floatingBtn) {
    floatingBtn.addEventListener("click", () => {
      window.location.href = "../../html/pages/club-notice-create.html";
    });
  }
}

// URL에서 탭 파라미터를 읽어 해당 탭 활성화 (메인화면에서 이동하는 부분 !)
function activateTabFromURL() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  if (tabParam) {
    const tabButtons = document.querySelectorAll(".tab-menu button");
    const targetButton = Array.from(tabButtons).find(
      button => button.dataset.category === tabParam
    );
    
    if (targetButton) {
      // 모든 탭에서 active 클래스 제거
      tabButtons.forEach(btn => btn.classList.remove("active"));
      
      // 선택한 탭에 active 클래스 추가
      targetButton.classList.add("active");
      
      // 해당 카테고리 필터링 적용
      filterNoticesByCategory(tabParam);
    }
  }
}

// 공지사항 필터링
function filterNoticesByCategory(category) {
  const allNotices = document.querySelectorAll(".notice-item");

  allNotices.forEach((notice) => {
    const noticeCategory = notice.querySelector(".notice-category").textContent;

    if (category === "all") {
      notice.style.display = "block";
    } else {
      // 카테고리 매핑
      const categoryMap = {
        vote: "투표",
        fee: "회비",
        attendance: "출석",
      };

      const mappedCategory = categoryMap[category];
      if (noticeCategory === mappedCategory) {
        notice.style.display = "block";
      } else {
        notice.style.display = "none";
      }
    }
  });
}



// 뒤로가기 버튼 이벤트 처리
document.querySelector(".back-btn").addEventListener("click", () => {
  window.history.back();
});

document.addEventListener("DOMContentLoaded", () => {
  initializeTabMenu();
  fetchNotices().then(() => {
    // 공지를 불러온 후 URL 파라미터에 따라 탭 활성화
    activateTabFromURL();
  });
  initializeFloatingButton();
});

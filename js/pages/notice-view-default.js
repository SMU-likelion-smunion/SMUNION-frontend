const BASE_URL = "https://smunion.shop";

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

function getNoticeId() {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("id");
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(
    2,
    "0"
  )}.${String(date.getDate()).padStart(2, "0")}`;
}

function calculateRemainingDays(dateStr) {
  const targetDate = new Date(dateStr);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays}일 남음` : "기한 지남";
}

async function displayAdminView(notice) {
  try {
    const token = getToken();
    const response = await fetch(
      `${BASE_URL}/api/v1/notices/basic/${notice.noticeId}/unread`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();
    if (data.isSuccess) {
      const noticeContent = document.querySelector(".notice-content");
      noticeContent.innerHTML = `
        <div class="notice-header">
          <span class="notice-type">Notice</span>
          <h1 class="notice-title">${notice.title}</h1>
          <p class="notice-desc">${notice.content || ""}</p>
          <div class="notice-info-wrapper">
            <p class="notice-info">
              <span class="target">대상: ${notice.target}</span>
              <span class="date">${formatDate(notice.date)}</span>
              <span class="tag">${calculateRemainingDays(notice.date)}</span>
            </p>
          </div>
        </div>

        <div class="notice-status-section">
          <div class="status-header">
            <h3>확인 현황</h3>
            <p class="status-summary">
              전체 ${data.result.unreadMembers.length}명 중 
              ${data.result.unreadMembers.length}명 미확인
            </p>
          </div>

          <div class="unread-section">
            <h4>미확인자 목록</h4>
            <div class="member-list">
              ${
                data.result.unreadMembers.length > 0
                  ? data.result.unreadMembers
                      .map(
                        (member) => `
                  <div class="member-item">
                    <span class="member-nickname">${member.nickname}</span>
                  </div>
                `
                      )
                      .join("")
                  : '<p class="empty-message">모든 멤버가 확인했습니다.</p>'
              }
            </div>
          </div>
        </div>
      `;

      // 추가 스타일
      const style = document.createElement("style");
      style.textContent = `
        .notice-status-section {
          margin-top: 32px;
        }

        .status-header {
          margin-bottom: 24px;
        }

        .status-header h3 {
          font-size: 18px;
          color: #333;
          margin-bottom: 8px;
        }

        .status-summary {
          font-size: 14px;
          color: #666;
        }

        .unread-section h4 {
          font-size: 16px;
          color: #666;
          margin-bottom: 12px;
        }

        .member-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .member-item {
          padding: 12px 16px;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }

        .member-nickname {
          font-size: 14px;
          color: #333;
        }

        .empty-message {
          color: #999;
          font-size: 14px;
          text-align: center;
          padding: 16px;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("현황을 불러오는데 실패했습니다.");
  }
}

async function loadNoticeDetail() {
  try {
    const noticeId = getNoticeId();
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    // 사용자 권한 확인 및 버튼 표시 설정
    await checkUserPermissions();

    // 기존 코드 계속...
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
    if (!data.isSuccess) throw new Error(data.message);

    displayNoticeDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("공지사항을 불러오는데 실패했습니다.");
  }
}

function displayNoticeDetail(notice) {
  document.querySelector(".notice-title").textContent = notice.title;
  document.querySelector(".notice-desc").textContent = notice.content || "";
  document.querySelector(".target").textContent = `대상: ${notice.target}`;
  document.querySelector(".date").textContent = formatDate(notice.date);

  const remainingTime = calculateRemainingDays(notice.date);
  const tagElement = document.querySelector(".tag");
  tagElement.textContent = remainingTime;
  if (remainingTime === "기한 지남") {
    tagElement.classList.add("over");
  }
}

function setupEventHandlers(notice) {
  // 뒤로가기 버튼
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 현황 버튼
  document.querySelector(".status-btn").addEventListener("click", () => {
    displayAdminView(notice);
  });

  // 확인 버튼
  document.querySelector(".submit-btn")?.addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/basic/${notice.noticeId}/read`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();
      if (data.isSuccess) {
        alert("확인 처리되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("확인 처리에 실패했습니다.");
    }
  });

  // 편집 버튼 
  document.querySelector(".edit-btn").addEventListener("click", () => {
    window.location.href = `club-notice-edit.html?id=${notice.noticeId}&type=basic`;
  });
  
  // 삭제 버튼
  document.querySelector(".delete-btn").addEventListener("click", async () => {
    if (confirm("정말로 이 공지를 삭제하시겠습니까?")) {
      try {
        const token = getToken();
        const response = await fetch(
          `${BASE_URL}/api/v1/notices/basic/${notice.noticeId}`,
          {
            method: "DELETE",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        const data = await response.json();
        if (data.isSuccess) {
          alert("공지가 삭제되었습니다.");
          window.location.href = "notice-all.html";
        } else {
          throw new Error(data.message || "공지 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("공지 삭제 중 오류 발생:", error);
        alert(`공지 삭제에 실패했습니다: ${error.message}`);
      }
    }
  });
}

/**
 * 사용자가 운영진인지 확인하고 버튼 표시 여부를 결정하는 함수
 */
async function checkUserPermissions() {
  try {
    const token = getToken();
    const response = await fetch(`${BASE_URL}/api/v1/users/clubs/selected`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (data.isSuccess) {
      // 사용자가 운영진인 경우에만 편집 및 삭제 버튼 표시
      const isAdmin = data.result.departmentName === "운영진";
      
      // 편집 버튼 표시 여부 설정
      const editButton = document.querySelector(".edit-btn");
      if (editButton) {
        editButton.style.display = isAdmin ? "block" : "none";
      }
      // 현황 버튼 표시 여부 설정
      const statusButton = document.querySelector(".status-btn");
      if (statusButton) {
        statusButton.style.display = isAdmin ? "block" : "none";
      }
      
      // 삭제 버튼 표시 여부 설정
      const deleteButton = document.querySelector(".delete-btn");
      if (deleteButton) {
        deleteButton.style.display = isAdmin ? "block" : "none";
      }
    } else {
      console.error("동아리 정보 조회 실패:", data.message);
      // 실패 시 버튼 숨기기
      hideAdminButtons();
    }
  } catch (error) {
    console.error("운영진 권한 확인 중 오류 발생:", error);
    // 오류 발생 시 편집/삭제 버튼 숨기기
    hideAdminButtons();
  }
}

/**
 * 관리자 버튼(편집, 삭제)을 숨기는 헬퍼 함수
 */
function hideAdminButtons() {
  const editButton = document.querySelector(".edit-btn");
  const deleteButton = document.querySelector(".delete-btn");
  const statusButton = document.querySelector(".status-btn");

  if (statusButton) statusButton.style.display = "none";
  if (editButton) editButton.style.display = "none";
  if (deleteButton) deleteButton.style.display = "none";
}


// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadNoticeDetail);

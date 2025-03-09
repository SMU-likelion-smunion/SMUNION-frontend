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

function getAttendanceId() {
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

function calculateTimeUntilStart(dateStr) {
  const targetDate = new Date(dateStr);
  const today = new Date();
  const diffTime = targetDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? `${diffDays}일 뒤 시작` : "진행중";
}

async function displayAdminView(attendance) {
  try {
    const token = getToken();

    // 출석 코드와 미출석자 목록 가져오기
    const [codeResponse, absenteesResponse] = await Promise.all([
      fetch(
        `${BASE_URL}/api/v1/notices/attendance/${attendance.attendanceId}/code`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      fetch(
        `${BASE_URL}/api/v1/notices/attendance/status?attendanceId=${attendance.attendanceId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
    ]);

    const [codeData, absenteesData] = await Promise.all([
      codeResponse.json(),
      absenteesResponse.json(),
    ]);

    if (codeData.isSuccess && absenteesData.isSuccess) {
      const noticeContent = document.querySelector(".notice-content");
      noticeContent.innerHTML = `
       <div class="notice-header">
         <span class="notice-type">Attendance</span>
         <h1 class="notice-title">${attendance.title}</h1>
         <p class="notice-desc">${attendance.content || ""}</p>
         <div class="notice-info-wrapper">
           <p class="notice-info">
             <span class="target">대상: ${attendance.target}</span>
             <span class="date">${formatDate(attendance.createdAt)}</span>
             <span class="tag">${calculateTimeUntilStart(
               attendance.date
             )}</span>
           </p>
         </div>
       </div>

       <div class="attendance-section">
         <div class="code-display">
           <h3>출석 코드</h3>
           <div class="code-wrapper">
             <span class="code">${codeData.result}</span>
             <button class="copy-btn" onclick="navigator.clipboard.writeText('${
               codeData.result
             }')">
               <i class="fas fa-copy"></i>
             </button>
           </div>
           <p class="code-notice">* 이 코드는 5분간 유효합니다</p>
         </div>

         <div class="absentees-section">
           <h3 class="absentees-title">미출석자 목록</h3>
           <div class="member-list">
             ${absenteesData.result.absentees
               .map(
                 (member) => `
               <div class="member-item">
                 <span class="member-nickname">${member.nickname}</span>
               </div>
             `
               )
               .join("")}
           </div>
         </div>
       </div>
     `;

      // 추가 스타일
      const style = document.createElement("style");
      style.textContent = `
       .code-display {
         margin: 24px 0;
         padding: 20px;
         background: #ffffff;
         border-radius: 12px;
         box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
       }

       .code-wrapper {
         display: flex;
         align-items: center;
         gap: 12px;
         margin: 12px 0;
       }

       .code {
         font-size: 24px;
         font-weight: bold;
         color: #0e207f;
         letter-spacing: 2px;
       }

       .code-notice {
         font-size: 12px;
         color: #666;
       }

       .absentees-section {
         margin-top: 32px;
       }

       .absentees-title {
         font-size: 16px;
         color: #666;
         margin-bottom: 16px;
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
     `;
      document.head.appendChild(style);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("현황을 불러오는데 실패했습니다.");
  }
}

async function loadAttendanceDetail() {
  try {
    const attendanceId = getAttendanceId();
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    await checkUserPermissions();

    const response = await fetch(
      `${BASE_URL}/api/v1/notices/attendance/${attendanceId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    if (!data.isSuccess) throw new Error(data.message);

    displayAttendanceDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("출석 공지를 불러오는데 실패했습니다.");
  }
}

function displayAttendanceDetail(attendance) {
  document.querySelector(".notice-title").textContent = attendance.title;
  document.querySelector(".notice-desc").textContent = attendance.content || "";
  document.querySelector(".target").textContent = `대상: ${attendance.target}`;
  document.querySelector(".date").textContent = formatDate(attendance.date);
  document.querySelector(".tag").textContent = calculateTimeUntilStart(
    attendance.date
  );
}

function setupEventHandlers(attendance) {
  // 뒤로가기 버튼
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 현황 버튼
  document.querySelector(".status-btn").addEventListener("click", () => {
    displayAdminView(attendance);
  });

  // 출석하기 버튼
  document.querySelector(".submit-btn")?.addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/attendance/verify`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            attendanceId: attendance.attendanceId,
          }),
        }
      );

      const data = await response.json();
      if (data.isSuccess) {
        alert("출석이 완료되었습니다.");
        window.location.reload();
      } else {
        document.querySelector(".error-message").style.display = "block";
      }
    } catch (error) {
      console.error("Error:", error);
      alert("출석 처리에 실패했습니다.");
    }
  });

  // 편집 버튼 이벤트 핸들러 추가
  document.querySelector(".edit-btn").addEventListener("click", () => {
    window.location.href = `club-notice-edit.html?id=${attendance.attendanceId}&type=attendance`;
  });
  
  // 삭제 버튼 이벤트 핸들러
  document.querySelector(".delete-btn").addEventListener("click", async () => {
    if (confirm("정말로 이 출석 공지를 삭제하시겠습니까?")) {
      try {
        const token = getToken();
        const response = await fetch(
          `${BASE_URL}/api/v1/notices/attendance/${attendance.attendanceId}`,
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
          alert("출석 공지가 삭제되었습니다.");
          window.location.href = "notice-all.html";
        } else {
          throw new Error(data.message || "출석 공지 삭제에 실패했습니다.");
        }
      } catch (error) {
        console.error("출석 공지 삭제 중 오류 발생:", error);
        alert(`출석 공지 삭제에 실패했습니다: ${error.message}`);
      }
    }
  });
}

/**
 * 사용자가 운영진인지 확인하고 버튼 표시 여부를 결정
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
 * 관리자 버튼(편집, 삭제) 숨기기 함수
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
document.addEventListener("DOMContentLoaded", loadAttendanceDetail);

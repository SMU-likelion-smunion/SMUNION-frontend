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

function getVoteId() {
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
  return diffDays > 0 ? `${diffDays}일 남음` : "마감됨";
}

// 관리자용 현황 화면 표시
async function displayAdminView(vote) {
  try {
    const token = getToken();

    // 투표 결과와 미참여자 목록을 동시에 가져오기
    const [resultsResponse, absenteesResponse] = await Promise.all([
      fetch(`${BASE_URL}/api/v1/notices/votes/${vote.voteId}/results`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
      fetch(`${BASE_URL}/api/v1/notices/votes/${vote.voteId}/absentees`, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    ]);

    const [resultsData, absenteesData] = await Promise.all([
      resultsResponse.json(),
      absenteesResponse.json(),
    ]);

    if (resultsData.isSuccess && absenteesData.isSuccess) {
      const noticeContent = document.querySelector(".notice-content");
      noticeContent.innerHTML = `
        <div class="notice-header">
          <span class="notice-type">Vote</span>
          <h1 class="notice-title">${vote.title}</h1>
          <p class="notice-desc">${vote.content || ""}</p>
          <div class="notice-info-wrapper">
            <p class="notice-info">
              <span class="target">대상: ${vote.target}</span>
              <span class="date">${formatDate(vote.createdAt)}</span>
              <span class="tag">${calculateRemainingDays(vote.date)}</span>
            </p>
          </div>
        </div>

        <div class="vote-section">
          ${resultsData.result.results
            .map(
              (result) => `
            <div class="vote-option status-view">
              <div class="vote-result-text">
                <span class="option-name">${result.optionName}</span>
                <span class="vote-count">${result.votes}명(${result.percentage}%)</span>
              </div>
              <div class="vote-progress-bar">
                <div class="progress" style="width: ${result.percentage}%"></div>
              </div>
            </div>
          `
            )
            .join("")}
          
          ${
            resultsData.result.anonymous
              ? `
            <p class="anonymous-notice">
              <i class="fas fa-lock"></i> 익명 투표입니다
            </p>
          `
              : ""
          }

          <div class="absentees-section">
            <h3 class="absentees-title">미참여자 목록</h3>
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
        .vote-option.status-view {
          flex-direction: column;
          gap: 8px;
          position: relative;
          overflow: hidden;
        }

        .vote-result-text {
          display: flex;
          justify-content: space-between;
          width: 100%;
          z-index: 1;
        }

        .vote-count {
          color: #0e207f;
          font-weight: 500;
        }

        .vote-progress-bar {
          position: absolute;
          left: 0;
          top: 0;
          height: 100%;
          width: 100%;
          background: transparent;
        }

        .progress {
          height: 100%;
          background-color: rgba(14, 32, 127, 0.1);
          transition: width 0.3s ease;
        }

        .anonymous-notice {
          text-align: right;
          color: #666;
          margin-top: 12px;
          font-size: 12px;
          padding: 0 20px;
        }

        .anonymous-notice i {
          margin-right: 4px;
        }

        .absentees-section {
          margin-top: 32px;
          padding: 0 20px;
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

        .member-nickname {
          font-size: 14px;
          color: #333;
        }
      `;
      document.head.appendChild(style);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("현황을 불러오는데 실패했습니다.");
  }
}

async function loadVoteDetail() {
  try {
    const voteId = getVoteId();
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    await checkUserPermissions();

    const response = await fetch(`${BASE_URL}/api/v1/notices/votes/${voteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.isSuccess) throw new Error(data.message);

    displayVoteDetail(data.result);
    setupVoteOptions(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("투표 공지를 불러오는 데 실패했습니다.");
  }
}

function displayVoteDetail(vote) {
  document.querySelector(".notice-title").textContent = vote.title;
  document.querySelector(".notice-desc").textContent = vote.content || "";
  document.querySelector(".target").textContent = `대상: ${vote.target}`;
  document.querySelector(".date").textContent = formatDate(vote.createdAt);

  const remainingTime = calculateRemainingDays(vote.date);
  const tagElement = document.querySelector(".tag");
  tagElement.textContent = remainingTime;
  if (remainingTime === "마감됨") {
    tagElement.classList.add("over");
    document.querySelector(".submit-btn")?.setAttribute("disabled", "true");
  }

  const voteTypeText = [];
  if (vote.allowDuplicate) voteTypeText.push("복수 선택");
  if (vote.anonymous) voteTypeText.push("익명 투표");
  document.querySelector(".vote-type").textContent = voteTypeText.join(", ");
}

function setupVoteOptions(vote) {
  const voteForm = document.querySelector(".vote-form");
  voteForm.innerHTML = "";

  vote.options.forEach((option) => {
    const optionDiv = document.createElement("div");
    optionDiv.className = "vote-option";

    const input = document.createElement("input");
    input.type = vote.allowDuplicate ? "checkbox" : "radio";
    input.name = "vote";
    input.id = `vote${option.voteOptionId}`;
    input.value = option.voteOptionId;

    const label = document.createElement("label");
    label.htmlFor = `vote${option.voteOptionId}`;
    label.textContent = option.optionName;

    optionDiv.appendChild(label);
    optionDiv.appendChild(input);
    voteForm.appendChild(optionDiv);
  });
}

function setupEventHandlers(vote) {
  // 뒤로가기 버튼
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 현황 버튼
  document.querySelector(".status-btn").addEventListener("click", () => {
    displayAdminView(vote);
  });

  // 투표하기 버튼
  document.querySelector(".submit-btn")?.addEventListener("click", async () => {
    const selectedOptions = [
      ...document.querySelectorAll('input[name="vote"]:checked'),
    ].map((input) => parseInt(input.value));

    if (selectedOptions.length === 0) {
      alert("투표 항목을 선택해주세요.");
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/votes/${vote.voteId}/participate`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ voteOptionIds: selectedOptions }),
        }
      );

      const data = await response.json();
      if (data.isSuccess) {
        alert("투표가 완료되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("투표 처리에 실패했습니다.");
    }
  });

    // 편집 버튼 이벤트 핸들러 
    document.querySelector(".edit-btn").addEventListener("click", () => {
      window.location.href = `club-notice-edit.html?id=${vote.voteId}&type=vote`;
    });
    
    // 삭제 버튼 이벤트 핸들러
    document.querySelector(".delete-btn").addEventListener("click", async () => {
      if (confirm("정말로 이 투표 공지를 삭제하시겠습니까?")) {
        try {
          const token = getToken();
          const response = await fetch(
            `${BASE_URL}/api/v1/notices/votes/${vote.voteId}`,
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
            alert("투표 공지가 삭제되었습니다.");
            window.location.href = "notice-all.html";
          } else {
            throw new Error(data.message || "투표 공지 삭제에 실패했습니다.");
          }
        } catch (error) {
          console.error("투표 공지 삭제 중 오류 발생:", error);
          alert(`투표 공지 삭제에 실패했습니다: ${error.message}`);
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
document.addEventListener("DOMContentLoaded", loadVoteDetail);

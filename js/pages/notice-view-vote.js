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

async function loadVoteDetail() {
  try {
    const voteId = getVoteId();
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    if (!voteId) {
      alert("잘못된 접근입니다.");
      window.location.href = "notice-all.html";
      return;
    }

    // 경로 수정: voteId -> id
    const response = await fetch(`${BASE_URL}/api/v1/notices/votes/${voteId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    console.log("API Response:", data); // 디버깅용 로그 추가

    if (!data.isSuccess) {
      throw new Error(data.message);
    }

    const vote = data.result;
    displayVoteDetail(vote);
    setupVoteOptions(vote);
    setupEventHandlers(vote);

    if (new Date(vote.date) < new Date()) {
      document.querySelector(".submit-btn").style.display = "none";
      loadVoteResults(vote.voteId);
    }
  } catch (error) {
    console.error("Error loading vote detail:", error); // 더 자세한 에러 로그
    alert("투표 공지를 불러오는데 실패했습니다.");
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
  }

  const voteTypeText = [];
  if (vote.allowDuplicate) voteTypeText.push("복수 선택");
  if (vote.anonymous) voteTypeText.push("익명 투표");
  document.querySelector(".vote-type").textContent = voteTypeText.join(", ");
}

function setupVoteOptions(vote) {
  const voteForm = document.querySelector(".vote-form");
  voteForm.innerHTML = ""; // 기존 옵션 초기화

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
    loadVoteResults(vote.voteId);
  });

  // 투표하기 버튼
  document.querySelector(".submit-btn").addEventListener("click", async () => {
    const selectedOptions = [];
    const inputs = document.querySelectorAll('input[name="vote"]:checked');
    inputs.forEach((input) => selectedOptions.push(parseInt(input.value)));

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
          body: JSON.stringify({
            voteOptionIds: selectedOptions,
          }),
        }
      );

      const data = await response.json();
      if (data.isSuccess) {
        alert("투표가 완료되었습니다.");
        window.location.reload();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("투표 처리에 실패했습니다.");
    }
  });
}

async function loadVoteResults(voteId) {
  try {
    const token = getToken();
    const response = await fetch(
      `${BASE_URL}/api/v1/notices/votes/${voteId}/results`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const data = await response.json();
    if (data.isSuccess) {
      displayVoteResults(data.result);
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error("Error:", error);
    alert("투표 현황을 불러오는데 실패했습니다.");
  }
}

function displayVoteResults(results) {
  let resultHtml = "<h3>투표 현황</h3>";
  results.results.forEach((result) => {
    resultHtml += `
      <div>
        <p>${result.optionName}: ${result.votes}표 (${result.percentage}%)</p>
      </div>
    `;
  });
  alert(resultHtml);
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadVoteDetail);

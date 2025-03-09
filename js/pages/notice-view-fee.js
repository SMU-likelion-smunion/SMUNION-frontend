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

function getFeeId() {
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

function calculateRemainingDays(deadlineStr) {
  const deadline = new Date(deadlineStr);
  const today = new Date();
  const diffTime = deadline - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

function formatAmount(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
}

async function displayAdminView(fee) {
  try {
    const token = getToken();
    const response = await fetch(
      `${BASE_URL}/api/v1/notices/fees/${fee.feeId}/unpaid`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const data = await response.json();
    if (data.isSuccess) {
      const noticeContent = document.querySelector(".notice-content");
      noticeContent.innerHTML = `
        <div class="notice-header">
          <span class="notice-type">Pay</span>
          <h1 class="notice-title">${fee.title}</h1>
          <p class="notice-desc">${fee.content || ""}</p>
          <div class="notice-info-wrapper">
            <p class="notice-info">
              <span class="target">대상: ${fee.target}</span>
              <span class="date">${formatDate(fee.deadline)}</span>
              <span class="tag">${
                calculateRemainingDays(fee.deadline) > 0
                  ? `${calculateRemainingDays(fee.deadline)}일 남음`
                  : "기한 지남"
              }</span>
            </p>
          </div>
        </div>

        <div class="payment-section">
          <div class="amount-info">
            <label>인당</label>
            <p class="amount">${formatAmount(fee.amount)}</p>
          </div>
          
          <div class="account-info">
            <label>계좌 정보</label>
            <div class="account-details">
              <span class="bank">${fee.bank}</span>
              <span class="account-number">${fee.accountNumber}</span>
              <button class="copy-btn" onclick="navigator.clipboard.writeText('${
                fee.accountNumber
              }')">
                복사
              </button>
            </div>
          </div>

          <div class="unpaid-section">
            <h3 class="unpaid-title">미납부자 목록</h3>
            <div class="member-list">
              ${data.result.unpaidMembers
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
        .unpaid-section {
          margin-top: 32px;
        }

        .unpaid-title {
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

async function loadFeeDetail() {
  try {
    const feeId = getFeeId();
    const token = getToken();

    if (!token) {
      window.location.href = "login.html";
      return;
    }

    if (!feeId) {
      alert("잘못된 접근입니다.");
      window.location.href = "notice-all.html";
      return;
    }

    const response = await fetch(`${BASE_URL}/api/v1/notices/fees/${feeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();
    if (!data.isSuccess) throw new Error(data.message);

    displayFeeDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("회비 공지를 불러오는데 실패했습니다.");
  }
}

function displayFeeDetail(fee) {
  document.querySelector(".notice-title").textContent = fee.title;
  document.querySelector(".notice-desc").textContent = fee.content || "";
  document.querySelector(".target").textContent = `대상: ${fee.target}`;
  document.querySelector(".date").textContent = formatDate(fee.deadline);

  const remainingDays = calculateRemainingDays(fee.deadline);
  const tagElement = document.querySelector(".tag");
  if (remainingDays > 0) {
    tagElement.textContent = `${remainingDays}일 남음`;
  } else {
    tagElement.textContent = "기한 지남";
    tagElement.classList.add("over");
  }

  document.querySelector(".amount").textContent = formatAmount(fee.amount);
  document.querySelector(".bank").textContent = fee.bank;
  document.querySelector(".account-number").textContent = fee.accountNumber;
}

function setupEventHandlers(fee) {
  // 뒤로가기 버튼
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 계좌번호 복사 버튼
  document.querySelector(".copy-btn").addEventListener("click", () => {
    const accountNumber = document.querySelector(".account-number").textContent;
    navigator.clipboard
      .writeText(accountNumber)
      .then(() => alert("계좌번호가 복사되었습니다."))
      .catch((err) => console.error("복사 실패:", err));
  });

  // 현황 버튼 (관리자용)
  document.querySelector(".status-btn").addEventListener("click", () => {
    displayAdminView(fee);
  });
}



// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadFeeDetail);

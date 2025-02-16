// notice-view-fee.js
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

function formatAmount(amount) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "원";
}

async function loadFeeDetail() {
  const feeId = getFeeId();
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
    const response = await fetch(`${BASE_URL}/api/v1/notices/fees/${feeId}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (!data.isSuccess) {
      throw new Error(data.message);
    }

    displayFeeDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("회비 공지를 불러오는데 실패했습니다.");
  }
}

function displayFeeDetail(fee) {
  document.querySelector(".notice-title").textContent = fee.title;
  document.querySelector(".notice-desc").textContent = fee.content;
  document.querySelector(".target").textContent = `대상: ${fee.target}`;
  document.querySelector(".date").textContent = formatDate(fee.deadline);
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

  // 현황 버튼
  document.querySelector(".status-btn").addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/fees/${fee.feeId}/unpaid`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.isSuccess) {
        alert(`미납 인원: ${data.result.unpaidMembers.length}명`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("현황을 불러오는데 실패했습니다.");
    }
  });

  // 송금 완료 버튼
  document.querySelector(".submit-btn").addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/fees/${fee.feeId}/payment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.isSuccess) {
        alert("납부 처리가 완료되었습니다.");
        window.location.reload();
      }
    } catch (error) {
      console.error("Error:", error);
      alert("납부 처리에 실패했습니다.");
    }
  });
}

// 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadFeeDetail);

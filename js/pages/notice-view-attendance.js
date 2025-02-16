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

async function loadAttendanceDetail() {
  const attendanceId = getAttendanceId();
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return;
  }

  try {
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

    if (!data.isSuccess) {
      throw new Error(data.message);
    }

    displayAttendanceDetail(data.result);
    setupEventHandlers(data.result);
  } catch (error) {
    console.error("Error:", error);
    alert("출석 공지를 불러오는데 실패했습니다.");
  }
}

function displayAttendanceDetail(attendance) {
  document.querySelector(".notice-title").textContent = attendance.title;
  document.querySelector(".notice-desc").textContent = attendance.content;
  document.querySelector(".target").textContent = `대상: ${attendance.target}`;
  document.querySelector(".date").textContent = formatDate(attendance.date);
  document.querySelector(".tag").textContent = calculateTimeUntilStart(
    attendance.date
  );
}

function setupEventHandlers(attendance) {
  document.querySelector(".back-btn").addEventListener("click", () => {
    window.history.back();
  });

  // 현황 버튼 이벤트
  document.querySelector(".status-btn").addEventListener("click", async () => {
    try {
      const token = getToken();
      const response = await fetch(
        `${BASE_URL}/api/v1/notices/attendance/status?attendanceId=${attendance.attendanceId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.isSuccess) {
        alert(`미출석 인원: ${data.result.absentees.length}명`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("현황을 불러오는데 실패했습니다.");
    }
  });

  // 출석 확인 버튼 이벤트
  document.querySelector(".submit-btn").addEventListener("click", async () => {
    const code = document.querySelector(".code-input").value;
    if (!code) {
      document.querySelector(".error-message").style.display = "block";
      return;
    }

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
}

// 초기 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", loadAttendanceDetail);

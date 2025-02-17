const baseURL = "https://sumnion.shop/api/v1";
const accessToken = "your-access-token-here"; 
//  로그인 후 저장된 토큰

document.getElementById("saveButton").addEventListener("click", async () => {
  const joinCode = document.getElementById("joinCodeInput").value;
  const nickname = document.getElementById("nicknameInput").value;

  // 유효성 검사
  if (!joinCode || !nickname) {
    alert("참여 코드와 별명을 모두 입력해주세요.");
    return;
  }

  try {
    const response = await fetch(`${baseURL}/club/join`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        joincode: joinCode,
        nickname: nickname,
      }),
    });
    const result = await response.json();
    if (response.ok) {
      alert(result.message); 
      window.location.href = "myClub.html";
    } else {
      alert(result.message || "요청 중 오류가 발생했습니다.");
    }
  } catch (error) {
    console.error("Error:", error);
    alert("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
  }
});

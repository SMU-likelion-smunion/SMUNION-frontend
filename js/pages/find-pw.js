document.addEventListener("DOMContentLoaded", function () {
  var API_SERVER_DOMAIN = "https://smunion.shop";
  var sendButton = document.querySelector(".send-btn");
  var verificationInput = document.getElementById("verification-code");

  function sendVerificationCode(event) {
    event.preventDefault();

    var email = document.getElementById("email").value.trim();
    var emailError = document.querySelector(".email-error");

    // 이메일 검증
    if (!email) {
      emailError.textContent = "이메일을 입력해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else if (!email.endsWith("@sangmyung.kr")) {
      emailError.textContent = "sangmyung.kr 이메일을 사용해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else {
      emailError.style.display = "none";
    }

    // 인증번호 전송 API 호출
    var data = JSON.stringify({ email: email });

    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users/find-password", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.isSuccess) {
          alert("인증번호가 전송되었습니다. 이메일을 확인해주세요.");
          sendButton.removeEventListener("click", sendVerificationCode);
          window.location.replace("login.html");
        } else {
          alert(`인증번호 전송 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
      });
  }

  // 초기 버튼 이벤트 설정
  sendButton.addEventListener("click", sendVerificationCode);
});

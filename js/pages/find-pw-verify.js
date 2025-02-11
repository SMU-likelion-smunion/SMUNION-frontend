document.addEventListener("DOMContentLoaded", function () {
  var API_SERVER_DOMAIN = "https://smunion.shop";

  function sendVerificationNumber(event) {
    event.preventDefault(); // 기본 제출 동작을 막습니다.

    var email = document.getElementById("sign-up_email").value;

    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    // FormData 객체를 생성하고 이메일을 추가합니다.
    var formdata = new FormData();
    formdata.append("email", email);

    // 서버에 이메일 인증번호 요청을 보냅니다.
    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN_EMAIL_SEND, requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Verification email send failed");
        }
        return response.text();
      })
      .then((result) => {
        console.log(result);
        alert("인증번호가 이메일로 전송되었습니다.");
        startTimer(); // 인증번호 전송 후 타이머 시작
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  function verifyEmail(event) {
    event.preventDefault(); // 기본 제출 동작을 막습니다.

    var email = document.getElementById("sign-up_email").value;
    var verifyCode = document.getElementById(
      "sign-up_verification-number"
    ).value;

    if (!email) {
      alert("이메일을 입력해주세요.");
      return;
    }

    if (!verifyCode) {
      alert("인증번호를 입력해주세요.");
      return;
    }

    // FormData 객체를 생성하고 이메일과 인증번호를 추가합니다.
    var formdata = new FormData();
    formdata.append("verify", verifyCode);
    formdata.append("email", email);

    // 서버에 인증번호 확인 요청을 보냅니다.
    var requestOptions = {
      method: "POST",
      body: formdata,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN_EMAIL_VERIFY, requestOptions)
      .then((response) => {
        if (response.status != 202) {
          throw new Error("Verification failed");
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        alert("인증번호가 확인되었습니다.");
        clearInterval(timer); // 인증 성공 시 타이머 정지
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증번호 확인 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  // 회원가입 폼에 이벤트 리스너를 추가합니다.
  document
    .getElementById("sign-up_next")
    .addEventListener("click", submitSignUpForm);

  // 인증번호 전송 버튼에 이벤트 리스너를 추가합니다.
  document
    .getElementById("send_verification-number")
    .addEventListener("click", sendVerificationNumber);

  // 인증번호 재전송 버튼에 이벤트 리스너를 추가합니다.
  document
    .getElementById("resend_verification-number")
    .addEventListener("click", sendVerificationNumber);

  // 인증번호 확인 버튼에 이벤트 리스너를 추가합니다.
  document
    .getElementById("check_verification-number")
    .addEventListener("click", verifyEmail);

  const remainingTime = document.querySelector(".remaining-time");
  const remainingMin = document.querySelector(".remaining-min");
  const remainingSec = document.querySelector(".remaining-sec");
  const sendBtn = document.querySelector("#send_verification-number");
  const checkBtn = document.querySelector("#check_verification-number");
  const resendBtn = document.querySelector("#resend_verification-number");

  let time = 180;
  let timer; // 타이머 ID를 저장할 변수

  const startTimer = () => {
    remainingTime.classList.remove("hide"); // 인증번호 전송 버튼 클릭 시 remaining-time 나타남

    timer = setInterval(function () {
      if (time > 0) {
        time -= 1;
        let min = Math.floor(time / 60);
        let sec = String(time % 60).padStart(2, "0");
        remainingMin.innerText = min;
        remainingSec.innerText = sec;
      } else {
        // 0초가 되면 인증번호 전송&확인 버튼 비활성화
        sendBtn.disabled = true;
        checkBtn.disabled = true;
        sendBtn.style.backgroundColor = "gray";
        checkBtn.style.backgroundColor = "gray";
        clearInterval(timer); // 타이머 정지
      }
    }, 1000);
  };

  const resetTimer = () => {
    clearInterval(timer); // 기존 타이머 정지
    time = 180; // 시간 초기화
    sendBtn.disabled = false;
    checkBtn.disabled = false;
    sendBtn.style.backgroundColor = "";
    checkBtn.style.backgroundColor = "";
    startTimer(); // 타이머 재시작
  };

  // 이메일 입력 시 인증번호 전송 버튼 활성화
  document
    .getElementById("sign-up_email")
    .addEventListener("input", function () {
      var email = this.value;
      sendBtn.disabled = !email;
      resendBtn.disabled = !email;
    });

  resendBtn.addEventListener("click", resetTimer);
});

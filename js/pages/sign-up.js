document.addEventListener("DOMContentLoaded", function () {
  var API_SERVER_DOMAIN = "https://smunion.shop";

  var isEmailVerified = false; // 이메일 인증 상태

  function submitSignUpForm(event) {
    event.preventDefault(); // 기본 제출 동작을 막습니다.

    // 사용자가 입력한 정보 가져오기
    var email = document.getElementById("email").value.trim();
    var major = document.getElementById("major").value.trim();
    var name = document.getElementById("name").value.trim();
    var password = document.getElementById("pw").value.trim();
    var passwordCheck = document.getElementById("pw-check").value.trim();
    var emailError = document.querySelector(".email-error");
    var majorError = document.querySelector(".major-error");
    var nameError = document.querySelector(".name-error");
    var passwordError = document.querySelector(".password-error");

    var isValid = true; // 폼 유효성 상태

    // 이메일 검증
    if (!email) {
      emailError.textContent = "이메일을 입력해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else if (!email.endsWith("@sangmyung.kr")) {
      emailError.textContent = "sangmyung.kr 이메일을 사용해주세요.";
      emailError.style.display = "block";
      isValid = false;
    } else if (!isEmailVerified) {
      emailError.textContent = "이메일 인증이 필요합니다.";
      emailError.style.display = "block";
      isValid = false;
    } else {
      emailError.style.display = "none";
    }

    // 학과와 이름 입력 확인
    if (!major && !name) {
      majorError.textContent = "학과와 이름을 입력해주세요.";
      majorError.style.display = "block";
      nameError.style.display = "none"; // 중복 메시지 방지
      isValid = false;
    } else if (!major) {
      majorError.textContent = "학과를 입력해주세요.";
      majorError.style.display = "block";
      nameError.style.display = "none"; // 중복 메시지 방지
      isValid = false;
    } else if (!name) {
      nameError.textContent = "이름을 입력해주세요.";
      nameError.style.display = "block";
      majorError.style.display = "none"; // 중복 메시지 방지
      isValid = false;
    } else {
      majorError.style.display = "none";
      nameError.style.display = "none";
    }

    // 비밀번호 검증
    const passwordRegex =
      /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$/;
    if (!password) {
      passwordError.textContent = "비밀번호를 입력해주세요.";
      passwordError.style.display = "block";
      isValid = false;
    } else if (!passwordRegex.test(password)) {
      passwordError.textContent =
        "비밀번호는 8자 이상, 숫자와 특수문자를 포함해야 합니다.";
      passwordError.style.display = "block";
      isValid = false;
    } else if (password !== passwordCheck) {
      passwordError.textContent = "비밀번호가 일치하지 않습니다.";
      passwordError.style.display = "block";
      isValid = false;
    } else {
      passwordError.style.display = "none";
    }

    // 폼 유효성 검사 실패 시 종료
    if (!isValid) {
      return;
    }

    // JSON 객체 생성
    var data = JSON.stringify({
      email: email,
      password: password,
      major: major,
      name: name,
    });

    // 서버에 회원가입 요청 보내기
    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/users/signup", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.isSuccess) {
          alert("회원가입이 성공적으로 완료되었습니다!");
          // 로그인 페이지로 이동
          window.location.replace("login.html");
        } else {
          alert(`회원가입 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
        alert("회원가입 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

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
    } else if (!isEmailVerified) {
      emailError.textContent = "이메일 인증이 필요합니다.";
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

    fetch(API_SERVER_DOMAIN + "/api/v1/email/send/signup", requestOptions)
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
        } else {
          alert(`인증번호 전송 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증번호 전송 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  function verifyCode(event) {
    event.preventDefault();

    var email = document.getElementById("email").value.trim();
    var verificationCode = document
      .getElementById("verification-code")
      .value.trim();
    var emailError = document.querySelector(".email-error");

    // 이메일 및 인증코드 확인
    if (!email || !verificationCode) {
      emailError.textContent = "이메일과 인증번호를 입력해주세요.";
      emailError.style.display = "block";
      return;
    } else {
      emailError.style.display = "none";
    }

    // 인증번호 검증 API 호출
    var data = JSON.stringify({ email: email, code: verificationCode });

    var requestOptions = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: data,
      redirect: "follow",
    };

    fetch(API_SERVER_DOMAIN + "/api/v1/email/verify", requestOptions)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`${response.status}`);
        }
        return response.json();
      })
      .then((result) => {
        console.log(result);
        if (result.isSuccess) {
          alert("인증이 완료되었습니다.");
        } else {
          alert(`인증 실패: ${result.message}`);
        }
      })
      .catch((error) => {
        console.log("error", error);
        alert("인증 중 오류가 발생했습니다. 다시 시도해주세요.");
      });
  }

  // 초기 에러 메시지 숨기기
  const errorElements = document.querySelectorAll(".error-message");
  errorElements.forEach((element) => {
    element.style.display = "none";
  });

  // 회원가입 버튼에 이벤트 리스너 추가
  document
    .getElementById("submit-button")
    .addEventListener("click", submitSignUpForm);

  // 인증번호 전송 버튼에 이벤트 리스너 추가
  document
    .querySelector(".send-code-btn")
    .addEventListener("click", sendVerificationCode);

  // 인증번호 확인 버튼에 이벤트 리스너 추가
  document.querySelector(".verify-btn").addEventListener("click", verifyCode);
});

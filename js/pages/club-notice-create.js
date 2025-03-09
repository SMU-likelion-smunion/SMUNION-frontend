const API_SERVER_DOMAIN = "https://smunion.shop";
let accessToken = getCookie("accessToken");

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

/* 쿠키 관련 함수들 */
function setCookie(name, value, days) {
  var expires = "";
  if (days) {
    var date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + value + expires + "; path=/";
}

function getCookie(name) {
  var nameEQ = name + "=";
  var cookies = document.cookie.split(";");
  for (var i = 0; i < cookies.length; i++) {
    var cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return cookie.substring(nameEQ.length, cookie.length);
    }
  }
  return null;
}

function deleteCookie(name) {
  document.cookie = name + "=; Expires=Thu, 01 Jan 1970 00:00:01 GMT; path=/;";
}

function getDepartmentName() {
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //console.log("data", data);

      if (data.isSuccess) {
        //console.log("getDepartmentName 완료");

        const departmentName = data.result.departmentName; //departmentName 가져오기
        const clubName = data.result.clubName; // clubName 가져오기
        const url = data.result.url; // url 가져오기

        localStorage.setItem("departmentName", departmentName);
        localStorage.setItem("selectedClub", JSON.stringify({ clubName, url }));
      } else {
        throw new Error("부서 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

function getClubId() {
  let accessToken = getToken();
  fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs/selected`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //console.log("data", data);

      if (data.isSuccess) {
        //console.log("get memberClubId 완료");
        const currentClubId = data.result.memberClubId;
        localStorage.setItem("currentClubId", currentClubId);
        //console.log(currentClubId);
      } else {
        throw new Error("memberClubId 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

//공지 가져오기
function getClubDetail() {
  return fetch(API_SERVER_DOMAIN + `/api/v1/club/detail`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      if (data.isSuccess) {
        //console.log("동아리 전체 공지: ", data.result);
        const {
          basicNoticeDetailResponseList = [],
          attendanceDetailResponseList = [],
          feeNoticeResponseList = [],
          voteResponseList = [],
        } = data.result;

        return [
          ...basicNoticeDetailResponseList,
          ...attendanceDetailResponseList,
          ...feeNoticeResponseList,
          ...voteResponseList,
        ];
      } else {
        throw new Error("failed");
      }
    })
    .catch((error) => console.error("Error club detail:", error));
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();

  let allNotices = [];

  getDepartmentName();
  getClubDetail().then((notices) => {
    allNotices = notices || [];
    renderCalendar(allNotices);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  });

  const storedClubId = localStorage.getItem("currentClubId");
  localStorage.setItem("storedClubId", storedClubId);
  localStorage.removeItem("storedclubId");
  getClubId();
  const currentClubId = localStorage.getItem("currentClubId");

  if (currentClubId !== storedClubId) {
    //localStorage.setItem("currentClubId", currentClubId);
    localStorage.setItem("selectedDepartments", JSON.stringify([]));
  }

  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector(".cal-top-header img:first-child");
  const nextBtn = document.querySelector(".cal-top-header img:last-child");
  const calDates = document.querySelector(".cal-dates");

  const prevScreen = document.querySelector(".cancel-btn");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  //이전 페이지에서 선택한 날짜 가져오기
  const savedDate = localStorage.getItem("selectedDate");
  let defaultDate;

  //저장된 값 or 없으면 오늘 날짜
  if (savedDate) {
    defaultDate = new Date(savedDate);
  } else {
    defaultDate = today;
  }

  function renderCalendar(allNotices) {
    calDates.innerHTML = ""; //날짜 초기화
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    calHeader.textContent = `${year}년 ${month + 1}월 ${today.getDate()}일`; //년 월 일

    const firstDay = new Date(year, month, 1).getDay(); //이번 달 첫째날 (요일 계산->시작위치 설정)
    const lastDay = new Date(year, month + 1, 0).getDate(); //이번 달 마지막 날짜 (일수 계산)
    const prevLastDate = new Date(year, month, 0).getDate(); //이전 달 마지막 날짜

    const savedYear = defaultDate.getFullYear();
    const savedMonth = defaultDate.getMonth();
    const savedDay = defaultDate.getDate();

    const todayYear = today.getFullYear();
    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    //지난 달 날짜
    for (let i = 0; i < firstDay; i++) {
      let prevBlankDiv = document.createElement("div");
      prevBlankDiv.classList.add("prev-month");

      let prevBlankSpan = document.createElement("span");
      let prevDate = prevLastDate - (firstDay - 1) + i; // 이전 달의 날짜 계산
      prevBlankSpan.textContent = prevDate;
      prevBlankDiv.appendChild(prevBlankSpan);

      //공지 추가
      const noticeList = document.createElement("div");
      noticeList.classList.add("todo-list");

      // 공지 데이터 순회
      let count = 0; // 최대 3개까지 공지 표시
      const userDepartment = localStorage.getItem("departmentName"); // 사용자 부서 정보 가져오기
      const createDate = new Date(year, month - 1, prevDate); // 이전 달 날짜 생성

      for (let i = 0; i < allNotices.length; i++) {
        const notice = allNotices[i];

        //날짜 & 부서 필터링
        const noticeDate = new Date(notice.date);
        const isSameDate =
          createDate.getFullYear() === noticeDate.getFullYear() &&
          createDate.getMonth() === noticeDate.getMonth() &&
          createDate.getDate() === noticeDate.getDate();

        const targetDepartments = notice.target.split(",").map((target) => target.trim());
        const isTargetMatching =
          targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

        //필터링 후 공지 추가
        if (isSameDate && isTargetMatching && count < 3) {
          const todoItem = document.createElement("p");
          todoItem.textContent = notice.title;
          noticeList.appendChild(todoItem);
          count++;
        }

        //공지 최대 3개
        if (count >= 3) break;
      }
      prevBlankDiv.appendChild(noticeList);
      calDates.appendChild(prevBlankDiv);
    }

    //이번 달 날짜
    for (let i = 1; i <= lastDay; i++) {
      let dateDiv = document.createElement("div");
      dateDiv.classList.add("dates");
      let spanElement = document.createElement("span");
      spanElement.textContent = i;

      dateDiv.appendChild(spanElement);

      //공지 추가
      const noticeList = document.createElement("div");
      noticeList.classList.add("todo-list");

      // 공지 데이터 순회
      let count = 0; // 최대 3개까지 공지 표시
      const userDepartment = localStorage.getItem("departmentName"); // 사용자 부서 정보 가져오기
      const createDate = new Date(year, month, i);

      for (let i = 0; i < allNotices.length; i++) {
        const notice = allNotices[i];

        //날짜 & 부서 필터링
        const noticeDate = new Date(notice.date);
        const isSameDate =
          createDate.getFullYear() === noticeDate.getFullYear() &&
          createDate.getMonth() === noticeDate.getMonth() &&
          createDate.getDate() === noticeDate.getDate();

        const targetDepartments = notice.target.split(",").map((target) => target.trim());
        const isTargetMatching =
          targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

        //필터링 후 공지 추가
        if (isSameDate && isTargetMatching && count < 3) {
          const todoItem = document.createElement("p");
          todoItem.textContent = notice.title;
          noticeList.appendChild(todoItem);
          count++;
        }
        //공지 최대 3개
        if (count >= 3) break;
      }
      dateDiv.appendChild(noticeList);
      calDates.appendChild(dateDiv);

      //기본값으로 오늘 날짜 선택됨
      if (i === todayDate && year === todayYear && month === todayMonth) {
        dateDiv.classList.add("selected-date");
        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });

        const todayFormatted = `${todayYear}-${String(todayMonth + 1).padStart(2, "0")}-${String(todayDate).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", todayFormatted);
      }

      //날짜 클릭
      dateDiv.addEventListener("click", () => {
        document.querySelectorAll(".selected-date").forEach((item) => {
          item.classList.remove("selected-date");
          item.querySelectorAll(".todo-list p").forEach((p) => {
            p.style.backgroundColor = "#0E207F";
          });
        });
        dateDiv.classList.add("selected-date");
        calHeader.textContent = `${createDate.getFullYear()}년 ${createDate.getMonth() + 1}월 ${createDate.getDate()}일`;

        const selectedDate = `${createDate.getFullYear()}-${String(createDate.getMonth() + 1).padStart(2, "0")}-${String(createDate.getDate()).padStart(2, "0")}`;
        localStorage.setItem("selectedDate", selectedDate);

        dateDiv.querySelectorAll(".todo-list p").forEach((p) => {
          p.style.backgroundColor = "rgba(256, 256, 256, 0.3)";
        });
      });
    }

    //다음 달 날짜
    const remainDays = 7 - ((firstDay + lastDay) % 7);

    if (remainDays < 7) {
      for (let i = 1; i <= remainDays; i++) {
        let nextBlankDiv = document.createElement("div");
        nextBlankDiv.classList.add("next-month");
        let nextBlankSpan = document.createElement("span");
        nextBlankSpan.textContent = i;

        nextBlankDiv.appendChild(nextBlankSpan);

        //공지 추가
        const noticeList = document.createElement("div");
        noticeList.classList.add("todo-list");

        // 공지 데이터 순회
        let count = 0; // 최대 3개까지 공지 표시
        const userDepartment = localStorage.getItem("departmentName"); // 사용자 부서 정보 가져오기
        const createDate = new Date(year, month + 1, i); // 이전 달 날짜 생성

        for (let i = 0; i < allNotices.length; i++) {
          const notice = allNotices[i];

          //날짜 & 부서 필터링
          const noticeDate = new Date(notice.date);
          const isSameDate =
            createDate.getFullYear() === noticeDate.getFullYear() &&
            createDate.getMonth() === noticeDate.getMonth() &&
            createDate.getDate() === noticeDate.getDate();

          const targetDepartments = notice.target.split(",").map((target) => target.trim());
          const isTargetMatching =
            targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

          //필터링 후 공지 추가
          if (isSameDate && isTargetMatching && count < 3) {
            const todoItem = document.createElement("p");
            todoItem.textContent = notice.title;
            noticeList.appendChild(todoItem);
            count++;
          }

          //공지 최대 3개
          if (count >= 3) break;
        }

        calDates.appendChild(nextBlankDiv);
        nextBlankDiv.appendChild(noticeList);
      }
    }
  }

  //이전 달 클릭 > 이동
  prevBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(allNotices);
  });

  //다음 달 클릭 > 이동
  nextBtn.addEventListener("click", () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(allNotices);
  });

  renderCalendar(allNotices);

  //-----------------------------------------------------------------------------------
  //참여형 위젯 설정

  const noticeItem = document.getElementById("wi1"); //일반 공지
  const attendItem = document.getElementById("wi2"); //출석 체크
  const voteItem = document.getElementById("wi3"); //의견 수집
  const payItem = document.getElementById("wi4"); //회비 납부

  //참여형 위젯 설정 > 일반 공지
  noticeItem.addEventListener("click", function () {
    const innerDiv = this.querySelector("div");
    const savedCheck = innerDiv.querySelector(".saved-text");

    if (savedCheck) {
      //'저장됨' 있는지 확인
      savedCheck.remove();
    } else {
      savedText = document.createElement("p");
      savedText.textContent = "저장됨";
      savedText.classList.add("saved-text");
      innerDiv.appendChild(savedText);
    }
  });

  //참여형 위젯 설정 > 출석 체크
  attendItem.addEventListener("click", () => {
    window.location.href = "club-notice-create-attend.html";
  });

  //참여형 위젯 설정 > 의견 수집
  voteItem.addEventListener("click", () => {
    window.location.href = "club-notice-create-vote.html";
  });

  //참여형 위젯 설정 > 회비 납부
  payItem.addEventListener("click", () => {
    window.location.href = "club-notice-create-pay.html";
  });

  //-----------------------------------------------------------------------------------
  //전달 대상
  const targetType = document.querySelector(".target-type");
  const selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments")) || [];

  localStorage.setItem("selectedDepartments", JSON.stringify([]));

  fetch(API_SERVER_DOMAIN + `/api/v1/department/getAll`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      //console.log("target data", data);

      if (data.isSuccess) {
        const departments = data.result.departmentDTOS;

        departments.forEach((department) => {
          const targetItemDiv = document.createElement("div");
          targetItemDiv.classList.add("target-type-items");

          const departmentName = document.createElement("p");
          departmentName.textContent = department.name;
          targetItemDiv.appendChild(departmentName);

          const circleImg = document.createElement("img");

          // 체크 상태를 항상 '미선택'으로 설정
          circleImg.src = "/assets/icons/empty-circle.svg";
          circleImg.dataset.checked = "false";

          targetItemDiv.appendChild(circleImg);

          //부서 클릭했을 때
          targetItemDiv.addEventListener("click", () => {
            let selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments")) || [];
            if (circleImg.dataset.checked === "false") {
              circleImg.src = "/assets/icons/checked-target.svg";
              circleImg.dataset.checked = "true";
              selectedDepartments.push(department.name); //추가
            } else {
              circleImg.src = "/assets/icons/empty-circle.svg";
              circleImg.dataset.checked = "false";
              const index = selectedDepartments.indexOf(department.name);
              if (index > -1) selectedDepartments.splice(index, 1); //제거
            }

            localStorage.setItem("selectedDepartments", JSON.stringify(selectedDepartments));
          });

          targetType.appendChild(targetItemDiv);

          const itemHr = document.createElement("hr");
          targetType.appendChild(itemHr);
        });

        //'모두 선택' 클릭
        const selectAll = document.querySelector(".all-select");

        selectAll.addEventListener("click", () => {
          const allDepartments = document.querySelectorAll(".target-type-items img");
          const isAllSelected = [...allDepartments].every((img) => img.dataset.checked === "true");

          if (isAllSelected) {
            //해제
            allDepartments.forEach((img) => {
              img.src = "/assets/icons/empty-circle.svg";
              img.dataset.checked = "false";
            });
            localStorage.setItem("selectedDepartments", JSON.stringify([]));
          } else {
            //모두 선택
            const selectedNames = [];
            allDepartments.forEach((img) => {
              img.src = "/assets/icons/checked-target.svg";
              img.dataset.checked = "true";
              selectedNames.push(img.parentNode.querySelector("p").textContent);
            });
            localStorage.setItem("selectedDepartments", JSON.stringify(selectedNames));
          }
        });
      } else {
        throw new Error("가입된 동아리 목록 조회 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });

  //'취소' 버튼 클릭 > 이전 화면
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

  //참여형 위젯 '일반공지' 클릭 -> localStorage.noticeData 삭제
  const widgetBasic = document.querySelector("#wi1");
  widgetBasic.addEventListener("click", () => {
    localStorage.removeItem("noticeData");
  });

  //'완료' 버튼 클릭
  const completeBtn = document.querySelector(".complete-btn");
  const inputTitle = document.querySelector(".input-title");
  const inputExplain = document.querySelector(".input-explain");

  //위젯에 '저장됨' 표시 -> 클릭한 위젯과 noticeData.type 비교?

  //완료 버튼 클릭
  completeBtn.addEventListener("click", () => {
    //제목 입력 여부 확인 -> 없으면 alert
    if (!inputTitle.value.trim()) {
      alert("제목을 입력하세요.");
      return;
    }

    const selectedTargetString = localStorage.getItem("selectedDepartments");
    const selectedTarget = selectedTargetString ? JSON.parse(selectedTargetString) : [];
    const sDateString = localStorage.getItem("selectedDate");
    //console.log(sDateString);
    const sDate = new Date(sDateString);
    //console.log(sDate);

    //localStorage > noticeData 가져오기
    const noticeDataString = localStorage.getItem("noticeData");
    let noticeData = null;

    // noticeData가 존재하는 경우만 파싱
    if (noticeDataString) {
      try {
        noticeData = JSON.parse(noticeDataString);
      } catch (error) {
        console.error("파싱 오류:", error);
        return;
      }
    }

    let noticeInfo = {}; //API에 보낼 데이터
    let apiPath = ""; //공지 타입별 API

    if (!noticeData) {
      apiPath = "/api/v1/notices/basic";
      noticeInfo = {
        title: inputTitle.value.trim(),
        content: inputExplain.value.trim(),
        targetDepartments: selectedTarget,
        date: sDate,
      };
    } else {
      const noticeType = noticeData.type; //공지 type
      const noticeDate = noticeData.date; //날짜
      const payData = noticeData.payData;
      const attendData = noticeData.attendData;
      const voteData = noticeData.voteData;

      switch (noticeType) {
        case "attendance":
          apiPath = "/api/v1/notices/attendance";
          noticeInfo = {
            title: inputTitle.value.trim(),
            content: inputExplain.value.trim(),
            targetDepartments: selectedTarget,
            date: attendData.time,
          };
          //console.log(noticeData);

          break;

        case "pay":
          apiPath = "/api/v1/notices/fees";
          noticeInfo = {
            title: inputTitle.value.trim(),
            content: inputExplain.value.trim(),
            amount: payData.amount,
            bank: payData.bankName,
            accountNumber: payData.accountNumber,
            deadLine: sDate,
            participantCount: payData.participantCount,
            targetDepartments: selectedTarget,
          };
          //console.log(noticeData);
          break;

        case "vote":
          apiPath = "/api/v1/notices/votes";
          noticeInfo = {
            title: inputTitle.value.trim(),
            description: inputExplain.value.trim(),
            targetDepartments: selectedTarget,
            date: sDate,
            allowDuplicate: voteData.allowDuplicate,
            anonymous: voteData.anonymous,
            options: voteData.options,
          };
          //console.log(noticeData);
          break;
      }
    }

    const apiUrl = `${API_SERVER_DOMAIN}${apiPath}`;

    //console.log(apiUrl);
    //console.log(noticeInfo);
    //console.log(JSON.stringify(noticeInfo));

    fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      body: JSON.stringify(noticeInfo),
    })
      .then((response) => response.json())
      .then((data) => {
        //console.log("공지 등록 성공:", data);
        alert("공지 등록이 완료되었습니다!");
        window.history.back();
      })
      .catch((error) => {
        console.error("공지 등록 실패:", error);
        alert("공지 등록에 실패했습니다.");
      });
  });
});

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
      console.log("data", data);

      if (data.isSuccess) {
        console.log("getDepartmentName 완료");

        const departmentName = data.result.departmentName; //departmentName 가져오기
        localStorage.setItem("departmentName", departmentName);
        console.log(departmentName);
      } else {
        throw new Error("부서 가져오기 실패");
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
        console.log("동아리 전체 공지: ", data.result);
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
  console.log(accessToken);

  let allNotices = [];

  getDepartmentName(); //departmentName 가져오기

  getClubDetail().then((notices) => {
    allNotices = notices || [];
    renderCalendar(allNotices);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    updateViewNotice(allNotices, todayFormatted);
  });

  function updateViewNotice(allNotices, selectedDate) {
    const userDepartment = localStorage.getItem("departmentName");
    const viewNotice = document.querySelector(".view-notice");
    viewNotice.innerHTML = ""; // 기존 공지 초기화

    let noticesHTML = "";

    allNotices.forEach((notice) => {
      const noticeDate = new Date(notice.date);
      const noticeFormatted = `${noticeDate.getFullYear()}-${String(noticeDate.getMonth() + 1).padStart(2, "0")}-${String(noticeDate.getDate()).padStart(2, "0")}`;

      const targetDepartments = notice.target.split(",").map((target) => target.trim());
      const isTargetMatching =
        targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

      if (noticeFormatted === selectedDate && isTargetMatching) {
        noticesHTML += `
          <div class="view-notice-items">
            <p>${notice.target}</p>
            <img src="/assets/icons/rectangle1.svg" />
            <p>${notice.title}</p>
            <img src="/assets/icons/Forth.svg" />
          </div>
        `;
      }
    });
    viewNotice.innerHTML = noticesHTML;

    // 공지 클릭 시 이동
    const noticeItems = viewNotice.querySelectorAll(".view-notice-items");
    noticeItems.forEach((noticeItem) => {
      noticeItem.addEventListener("click", () => {
        let noticeUrl = "";
        const noticeType = noticeItem.dataset.noticeType;
        const noticeId = noticeItem.dataset.noticeId;

        // 공지 타입에 따른 URL 생성
        if (noticeType === "default") {
          noticeUrl = `notice-view-default.html?id=${noticeId}`;
        } else if (noticeType === "attendance") {
          noticeUrl = `notice-view-attendance.html?id=${noticeId}`;
        } else if (noticeType === "fee") {
          noticeUrl = `notice-view-fee.html?id=${noticeId}`;
        } else if (noticeType === "vote") {
          noticeUrl = `notice-view-vote.html?id=${noticeId}`;
        }

        if (noticeUrl) {
          window.location.href = noticeUrl; // 해당 공지 페이지로 이동
        }
      });
    });
  }

  //공지 클릭 -> 이동

  const prevScreen = document.querySelector(".prev-screen");
  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector(".cal-top-header img:first-child");
  const nextBtn = document.querySelector(".cal-top-header img:last-child");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar(allNotices) {
    console.log("가져온 allNotices", allNotices);
    calDates.innerHTML = ""; //날짜 초기화
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const date = currentDate.getDate();

    calHeader.textContent = `${year}년 ${month + 1}월 ${date}일`; //년 월 일

    const firstDay = new Date(year, month, 1).getDay(); //이번 달 첫째날 (요일 계산->시작위치 설정)
    const lastDay = new Date(year, month + 1, 0).getDate(); //이번 달 마지막 날짜 (일수 계산)
    const prevLastDate = new Date(year, month, 0).getDate(); //이전 달 마지막 날짜

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

    //이번 달 날짜 생성
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
        updateViewNotice(allNotices, todayFormatted);
      }

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

        //캘린더 아래 공지 추가
        const viewNotice = document.querySelector(".view-notice");
        viewNotice.innerHTML = ""; // 기존 공지 초기화

        console.log("allNotices", allNotices);

        for (let i = 0; i < allNotices.length; i++) {
          const notice = allNotices[i];
          const noticeDate = new Date(notice.date);

          const isSameDate =
            createDate.getFullYear() === noticeDate.getFullYear() &&
            createDate.getMonth() === noticeDate.getMonth() &&
            createDate.getDate() === noticeDate.getDate();

          const targetDepartments = notice.target.split(",").map((target) => target.trim());
          const isTargetMatching =
            targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

          if (isSameDate && isTargetMatching) {
            const noticeItem = document.createElement("div");
            noticeItem.classList.add("view-notice-items");

            //공지 id를 data 속성으로 저장
            noticeItem.dataset.noticeId =
              notice.noticeId || notice.attendanceId || notice.feeId || notice.voteId;
            noticeItem.dataset.noticeType = notice.noticeId
              ? "default"
              : notice.attendanceId
                ? "attendance"
                : notice.feeId
                  ? "fee"
                  : "vote";

            const targetP = document.createElement("p");
            targetP.textContent = notice.target;
            noticeItem.appendChild(targetP);

            const img1 = document.createElement("img");
            img1.src = "/assets/icons/rectangle1.svg";
            noticeItem.appendChild(img1);

            const titleP = document.createElement("p");
            titleP.textContent = notice.title;
            noticeItem.appendChild(titleP);

            const img2 = document.createElement("img");
            img2.src = "/assets/icons/Forth.svg";
            noticeItem.appendChild(img2);

            console.log("..", noticeItem);

            //공지별 이동
            noticeItem.addEventListener("click", () => {
              let noticeUrl = "";

              if (noticeItem.dataset.noticeType === "default") {
                noticeUrl = `notice-view-default.html?id=${noticeItem.dataset.noticeId}`;
              } else if (noticeItem.dataset.noticeType === "attendance") {
                noticeUrl = `notice-view-attendance.html?id=${noticeItem.dataset.noticeId}`;
              } else if (noticeItem.dataset.noticeType === "fee") {
                noticeUrl = `notice-view-fee.html?id=${noticeItem.dataset.noticeId}`;
              } else if (noticeItem.dataset.noticeType === "vote") {
                noticeUrl = `notice-view-vote.html?id=${noticeItem.dataset.noticeId}`;
              }

              if (noticeUrl) {
                window.location.href = noticeUrl;
              }
            });

            viewNotice.appendChild(noticeItem);
          }
        }
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

  //이전 화면으로 이동
  prevScreen.addEventListener("click", () => {
    window.history.back();
  });

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

  //새로운 공지 추가 클릭
  const addNotice = document.querySelector(".add-notice-box");
  if (addNotice) {
    addNotice.addEventListener("click", () => {
      location.href = "club-notice-create.html";
    });
  }

  renderCalendar(allNotices);
});

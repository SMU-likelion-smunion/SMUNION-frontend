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

async function changeModalData() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + `/api/v1/users/clubs`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();
    //console.log("changeModalData", data);

    if (data.isSuccess) {
      return data.result;
    } else {
      throw new Error("가입된 동아리 목록 조회 실패");
    }
  } catch (error) {
    console.error("Error", error);
    return [];
  }
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

        //헤더에 반영
        const headerImg = document.querySelector(".club-img");
        headerImg.src = url;

        //console.log(departmentName, clubName, url);
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

// 특정 동아리 세션에 저장
async function selectClub(memberClubId) {
  let accessToken = getCookie("accessToken");
  //console.log("선택한 동아리 ID:", memberClubId);

  try {
    const response = await fetch(
      `${API_SERVER_DOMAIN}/api/v1/users/clubs/select?memberClubId=${memberClubId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const data = await response.json();
    if (data.isSuccess) {
      //console.log("동아리 선택 성공:", data);
      const selectedClub = data.result; //선택한 동아리 정보 저장

      // 헤더 업데이트
      const headerName = document.querySelector(".header-name");
      const headerImg = document.querySelector(".header-img");

      headerName.textContent = selectedClub.clubName;
      headerImg.src = selectedClub.url;

      // 선택한 동아리 정보 로컬 스토리지에 저장 (필요시)
      localStorage.setItem("selectedClub", JSON.stringify(selectedClub));
    } else {
      throw new Error("동아리 선택 실패");
    }
  } catch (error) {
    console.error("Error selecting club:", error);
  }
}

//modal item 생성 함수
function createModalItem(image, clubName, memberClubId) {
  const div = document.createElement("div");
  const modalItem = document.createElement("div");

  modalItem.classList.add("modal-items");
  modalItem.dataset.memberClubId = memberClubId;

  div.addEventListener("click", () => {
    const selectedId = div.dataset.memberClubId;
    selectClub(selectedId);
    closeModal();
    location.reload();
  });

  const img = document.createElement("img");
  img.src = image;

  const p = document.createElement("p");
  p.textContent = clubName;

  modalItem.appendChild(img);
  modalItem.appendChild(p);

  return modalItem;
}

async function addModalItems() {
  const modalContent = document.getElementById("modal-content");
  modalContent.innerHTML = ""; // 기존 내용 초기화

  try {
    const items = await changeModalData();
    //console.log("받은 데이터", items);

    if (!items || items.length === 0) {
      console.log("데이터 없음");
      return;
    }

    items.forEach((item, index) => {
      const modalItem = createModalItem(item.url, item.clubName, item.memberClubId);

      modalItem.addEventListener("click", async () => {
        try {
          await selectClub(item.memberClubId); // 동아리 선택
          closeModal();
          location.reload(); //새로고침
        } catch (error) {
          console.error("동아리 선택 오류:", error);
        }
      });

      modalContent.appendChild(modalItem);

      if (index < items.length - 1) {
        const hr = document.createElement("hr");
        modalContent.appendChild(hr);
      }
    });
  } catch (error) {
    console.error("모달 데이터 추가 중 오류 발생:", error);
  }
}

// 모달을 띄우는 함수
function openModal() {
  document.querySelector(".club-change-modal").style.display = "block";
  addModalItems();
}

// 모달을 닫는 함수
function closeModal() {
  document.querySelector(".club-change-modal").style.display = "none";
}

//캘린더 아래 공지 생성
function updateViewNotice(allNotices, selectedDate) {
  const userDepartment = localStorage.getItem("departmentName");
  const viewNotice = document.querySelector(".view-notice");
  viewNotice.innerHTML = ""; // 기존 공지 초기화

  let noticesHTML = "";
  let count = 0;

  allNotices.forEach((notice) => {
    const noticeDate = new Date(notice.date);
    const noticeFormatted = `${noticeDate.getFullYear()}-${String(noticeDate.getMonth() + 1).padStart(2, "0")}-${String(noticeDate.getDate()).padStart(2, "0")}`;

    const targetDepartments = notice.target.split(",").map((target) => target.trim());
    const isTargetMatching =
      targetDepartments.includes("전체") || targetDepartments.includes(userDepartment);

    if (noticeFormatted === selectedDate && isTargetMatching && count < 2) {
      noticesHTML += `
        <div class="view-notice-items" data-id="${notice.noticeId || notice.feeId || notice.attendanceId || notice.voteId}" data-type="${notice.noticeId ? "basic" : notice.feeId ? "fee" : notice.attendanceId ? "attendance" : "vote"}">
          <p>${notice.target}</p>
          <img src="/assets/icons/rectangle1.svg" />
          <p>${notice.title}</p>
          <img src="/assets/icons/Forth.svg" />
        </div>
      `;
      count++;
    }
    viewNotice.innerHTML = noticesHTML;

    document.querySelectorAll(".view-notice-items").forEach((item) => {
      item.addEventListener("click", () => {
        const id = item.getAttribute("data-id");
        const type = item.getAttribute("data-type");

        let noticeUrl;
        switch (type) {
          case "basic":
            noticeUrl = `notice-view-default.html?id=${id}`;
            break;
          case "fee":
            noticeUrl = `notice-view-fee.html?id=${id}`;
            break;
          case "attendance":
            noticeUrl = `notice-view-attendance.html?id=${id}`;
            break;
          case "vote":
            noticeUrl = `notice-view-vote.html?id=${id}`;
            break;
          default:
            console.log("failed to create noticeUrl");
            return;
        }

        window.location.href = noticeUrl;
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  let accessToken = getToken();
  let allNotices = [];

  const modal = document.querySelector(".club-change-modal");
  const modalClick = document.querySelector(".modal-click2");

  //modal 열기
  modalClick.addEventListener("click", () => {
    modal.style.display = "block";
    openModal();
  });

  //modal 닫기
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      const modalContent = document.querySelector(".ccm2");
      modalContent.innerHTML = "";
      modal.style.display = "none";
    }
  });

  getDepartmentName(); //departmentName 가져오기

  getClubDetail().then((notices) => {
    allNotices = notices || [];
    renderCalendar(allNotices);

    const today = new Date();
    const todayFormatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

    updateViewNotice(allNotices, todayFormatted);
  });

  const prevScreen = document.querySelector(".prev-screen");
  //캘린더 헤더 날짜
  const calHeader = document.querySelector(".cal-top-header h1");
  const prevBtn = document.querySelector(".cal-top-header img:first-child");
  const nextBtn = document.querySelector(".cal-top-header img:last-child");
  const calDates = document.querySelector(".cal-dates");

  let currentDate = new Date(); //현재 화면의 날짜
  const today = new Date(); //오늘 날짜

  function renderCalendar(allNotices) {
    //console.log("가져온 allNotices", allNotices);
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
        updateViewNotice(allNotices, selectedDate);
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

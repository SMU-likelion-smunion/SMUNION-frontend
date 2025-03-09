const API_SERVER_DOMAIN = "https://smunion.shop";

let accessToken = getCookie("accessToken");
let noticeId, noticeType; // 전역 변수로 공지 ID와 타입 저장

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
        const clubName = data.result.clubName; // clubName 가져오기
        const url = data.result.url; // url 가져오기

        localStorage.setItem("departmentName", departmentName);
        localStorage.setItem("selectedClub", JSON.stringify({ clubName, url }));

        console.log(departmentName, clubName, url);
      } else {
        throw new Error("부서 가져오기 실패");
      }
    })
    .catch((error) => {
      console.error("Error", error);
    });
}

// URL에서 ID와 타입 파라미터 가져오기
function getNoticeParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("id");
  const type = urlParams.get("type");
  
  if (!id || !type) {
    alert("공지 정보가 올바르지 않습니다.");
    window.history.back();
    return { id: null, type: null };
  }
  
  return { id, type };
}

// 공지 데이터 로드 함수
async function loadNoticeData(id, type) {
  try {
    let endpoint;
    
    // 타입에 따른 API 엔드포인트 설정
    switch (type) {
      case "basic":
        endpoint = `/api/v1/notices/basic/${id}`;
        break;
      case "vote":
        endpoint = `/api/v1/notices/votes/${id}`;
        break;
      case "fee":
        endpoint = `/api/v1/notices/fees/${id}`;
        break;
      case "attendance":
        endpoint = `/api/v1/notices/attendance/${id}`;
        break;
      default:
        throw new Error("지원하지 않는 공지 타입입니다.");
    }
    
    const response = await fetch(API_SERVER_DOMAIN + endpoint, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });
    
    const data = await response.json();
    
    if (!data.isSuccess) {
      throw new Error(data.message || "공지 데이터를 불러오는데 실패했습니다.");
    }
    
    console.log("가져온 공지 데이터:", data.result);
    return data.result;
  } catch (error) {
    console.error("공지 데이터 로드 오류:", error);
    alert("공지 데이터를 불러오는데 실패했습니다.");
    window.history.back();
    return null;
  }
}

// 캘린더 날짜를 선택하는 함수
function selectDateInCalendar(dateStr) {
  if (!dateStr) return;
  
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  
  // 현재 표시된 캘린더의 월을 조정
  currentDate.setFullYear(year);
  currentDate.setMonth(month);
  
  // 캘린더 다시 렌더링
  renderCalendar(allNotices);
  
  // 해당 날짜 요소 찾기
  setTimeout(() => {
    const dateElements = document.querySelectorAll(".dates");
    dateElements.forEach(dateDiv => {
      const dateText = dateDiv.querySelector("span").textContent;
      if (parseInt(dateText) === day) {
        // 날짜 선택
        dateDiv.click();
      }
    });
  }, 100);
}

// 위젯 타입에 따라 선택 상태로 만드는 함수
function selectWidgetType(type) {
  // 먼저 모든 위젯의 '저장됨' 텍스트 제거
  document.querySelectorAll(".widget-items").forEach(widget => {
    const innerDiv = widget.querySelector("div");
    const savedCheck = innerDiv.querySelector(".saved-text");
    if (savedCheck) {
      savedCheck.remove();
    }
  });
  
  let widgetId;
  switch (type) {
    case "basic":
      widgetId = "wi1";
      break;
    case "attendance":
      widgetId = "wi2";
      break;
    case "vote":
      widgetId = "wi3";
      break;
    case "fee":
      widgetId = "wi4";
      break;
  }
  
  if (widgetId) {
    const widget = document.getElementById(widgetId);
    const innerDiv = widget.querySelector("div");
    
    // '저장됨' 텍스트 추가
    const savedText = document.createElement("p");
    savedText.textContent = "저장됨";
    savedText.classList.add("saved-text");
    innerDiv.appendChild(savedText);
  }
}

// 전달 대상 체크박스 선택 함수
function selectTargetDepartments(targetStr) {
  if (!targetStr) return;
  
  const targets = targetStr.split(",").map(t => t.trim());
  
  // 전달 대상 체크박스 요소들을 순회하면서 일치하는 것 선택
  const targetElements = document.querySelectorAll(".target-type-items");
  targetElements.forEach(element => {
    const departmentName = element.querySelector("p").textContent;
    const checkImg = element.querySelector("img");
    
    if (targets.includes(departmentName) || targets.includes("전체")) {
      checkImg.src = "/assets/icons/checked-target.svg";
      checkImg.dataset.checked = "true";
    }
  });
  
  // localStorage에 선택된 부서 저장
  localStorage.setItem("selectedDepartments", JSON.stringify(targets));
}

// 폼에 공지 데이터 채우기
function fillFormWithNoticeData(noticeData, type) {
  // 제목과 내용 채우기
  const titleInput = document.querySelector(".input-title");
  const descInput = document.querySelector(".input-explain");
  
  titleInput.value = noticeData.title || "";
  descInput.value = noticeData.content || "";
  
  // 날짜 설정
  let dateStr;
  switch (type) {
    case "fee":
      dateStr = noticeData.deadline;
      break;
    default:
      dateStr = noticeData.date;
  }
  
  if (dateStr) {
    localStorage.setItem("selectedDate", new Date(dateStr).toISOString().split('T')[0]);
    selectDateInCalendar(dateStr);
  }
  
  // 위젯 타입 선택
  selectWidgetType(type);
  
  // 전달 대상 선택
  if (noticeData.target) {
    selectTargetDepartments(noticeData.target);
  }
  
  // 타입별 추가 데이터 저장
  switch (type) {
    case "vote":
      if (noticeData.options && noticeData.allowDuplicate !== undefined) {
        const voteData = {
          options: noticeData.options.map(opt => opt.optionName),
          allowDuplicate: noticeData.allowDuplicate,
          anonymous: noticeData.anonymous || false
        };
        localStorage.setItem("voteData", JSON.stringify(voteData));
      }
      break;
      
    case "fee":
      if (noticeData.amount !== undefined && noticeData.bank && noticeData.accountNumber) {
        const payData = {
          amount: noticeData.amount,
          bankName: noticeData.bank,
          accountNumber: noticeData.accountNumber,
          participantCount: noticeData.participantCount || 1
        };
        localStorage.setItem("payData", JSON.stringify(payData));
      }
      break;
      
    case "attendance":
      if (dateStr) {
        const attendData = {
          time: new Date(dateStr).toISOString()
        };
        localStorage.setItem("attendData", JSON.stringify(attendData));
      }
      break;
  }
  
  // 공지 타입에 따른 noticeData 저장
  const fullNoticeData = {
    type: type,
    title: titleInput.value,
    description: descInput.value,
    targetDepartments: JSON.parse(localStorage.getItem("selectedDepartments") || "[]"),
    date: localStorage.getItem("selectedDate")
  };
  
  // 타입별 추가 데이터
  switch (type) {
    case "vote":
      fullNoticeData.voteData = JSON.parse(localStorage.getItem("voteData") || "{}");
      break;
    case "fee":
      fullNoticeData.payData = JSON.parse(localStorage.getItem("payData") || "{}");
      break;
    case "attendance":
      fullNoticeData.attendData = JSON.parse(localStorage.getItem("attendData") || "{}");
      break;
  }
  
  localStorage.setItem("noticeData", JSON.stringify(fullNoticeData));
}

// 공지 업데이트 함수
async function updateNotice() {
  const inputTitle = document.querySelector(".input-title");
  const inputExplain = document.querySelector(".input-explain");
  
  // 제목 입력 여부 확인
  if (!inputTitle.value.trim()) {
    alert("제목을 입력하세요.");
    return;
  }
  
  const selectedTargetString = localStorage.getItem("selectedDepartments");
  const selectedTarget = selectedTargetString ? JSON.parse(selectedTargetString) : [];
  const sDateString = localStorage.getItem("selectedDate");
  const sDate = new Date(sDateString);
  
  let apiPath = "";
  let updateData = {};
  
  // 타입별 API 경로와 업데이트 데이터 설정
  switch (noticeType) {
    case "basic":
      apiPath = `/api/v1/notices/basic/${noticeId}`;
      updateData = {
        title: inputTitle.value.trim(),
        content: inputExplain.value.trim(),
        targetDepartments: selectedTarget,
        date: sDate
      };
      break;
      
    case "attendance":
      apiPath = `/api/v1/notices/attendance/${noticeId}`;
      const attendData = JSON.parse(localStorage.getItem("attendData") || "{}");
      updateData = {
        title: inputTitle.value.trim(),
        content: inputExplain.value.trim(),
        targetDepartments: selectedTarget,
        date: attendData.time || sDate
      };
      break;
      
    case "fee":
      apiPath = `/api/v1/notices/fees/${noticeId}`;
      const payData = JSON.parse(localStorage.getItem("payData") || "{}");
      updateData = {
        title: inputTitle.value.trim(),
        content: inputExplain.value.trim(),
        amount: payData.amount,
        bank: payData.bankName,
        accountNumber: payData.accountNumber,
        date: sDate,
        participantCount: payData.participantCount,
        targetDepartments: selectedTarget
      };
      break;
      
    case "vote":
      apiPath = `/api/v1/notices/votes/${noticeId}`;
      const voteData = JSON.parse(localStorage.getItem("voteData") || "{}");
      updateData = {
        title: inputTitle.value.trim(),
        content: inputExplain.value.trim(),
        date: sDate,
        allowDuplicate: voteData.allowDuplicate,
        options: voteData.options
      };
      break;
      
    default:
      alert("지원하지 않는 공지 타입입니다.");
      return;
  }
  
  try {
    console.log("업데이트 요청 데이터:", updateData);
    
    const response = await fetch(API_SERVER_DOMAIN + apiPath, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + accessToken,
      },
      body: JSON.stringify(updateData),
    });
    
    const data = await response.json();
    
    if (data.isSuccess) {
      alert("공지 수정이 완료되었습니다!");
      
      // 수정 성공 후 해당 공지 상세 페이지로 이동
      let detailPageUrl;
      switch (noticeType) {
        case "basic":
          detailPageUrl = `notice-view-default.html?id=${noticeId}`;
          break;
        case "vote":
          detailPageUrl = `notice-view-vote.html?id=${noticeId}`;
          break;
        case "fee":
          detailPageUrl = `notice-view-fee.html?id=${noticeId}`;
          break;
        case "attendance":
          detailPageUrl = `notice-view-attendance.html?id=${noticeId}`;
          break;
      }
      
      window.location.href = detailPageUrl;
    } else {
      throw new Error(data.message || "공지 수정에 실패했습니다.");
    }
  } catch (error) {
    console.error("공지 수정 실패:", error);
    alert(`공지 수정에 실패했습니다: ${error.message}`);
  }
}

//-----------------------------------------------------------------------------------
//캘린더 헤더 날짜
let currentDate = new Date(); //현재 화면의 날짜
const today = new Date(); //오늘 날짜
let allNotices = [];

// 캘린더 렌더링 함수
function renderCalendar(allNotices) {
  const calDates = document.querySelector(".cal-dates");
  calDates.innerHTML = ""; //날짜 초기화
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const date = currentDate.getDate();

  const calHeader = document.querySelector(".cal-top-header h1");
  calHeader.textContent = `${year}년 ${month + 1}월 ${today.getDate()}일`; //년 월 일

  const firstDay = new Date(year, month, 1).getDay(); //이번 달 첫째날 (요일 계산->시작위치 설정)
  const lastDay = new Date(year, month + 1, 0).getDate(); //이번 달 마지막 날짜 (일수 계산)
  const prevLastDate = new Date(year, month, 0).getDate(); //이전 달 마지막 날짜

  const savedYear = currentDate.getFullYear();
  const savedMonth = currentDate.getMonth();
  const savedDay = currentDate.getDate();

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

      const targetDepartments = notice.target ? notice.target.split(",").map((target) => target.trim()) : [];
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

      const targetDepartments = notice.target ? notice.target.split(",").map((target) => target.trim()) : [];
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

        const targetDepartments = notice.target ? notice.target.split(",").map((target) => target.trim()) : [];
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
      nextBlankDiv.appendChild(noticeList);
      calDates.appendChild(nextBlankDiv);
    }
  }
}

// 이전 달 클릭 이벤트 핸들러 - 수정된 선택자 사용
document.querySelector(".cal-top-header img:first-child").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar(allNotices);
});
  
  // 다음 달 클릭 이벤트 핸들러 - 수정된 선택자 사용
document.querySelector(".cal-top-header img:last-child").addEventListener("click", function () {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar(allNotices);
});

// 전체 공지 데이터 가져오기
async function fetchAllNotices() {
  try {
    const response = await fetch(API_SERVER_DOMAIN + "/api/v1/notices", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    
    const data = await response.json();
    
    if (data.isSuccess) {
      console.log("전체 공지 데이터 가져오기 성공");
      allNotices = data.result.notices || [];
      renderCalendar(allNotices);
    } else {
      console.error("전체 공지 가져오기 실패:", data.message);
    }
  } catch (error) {
    console.error("전체 공지 가져오기 오류:", error);
  }
}

// 페이지 로드 시 실행되는 초기화 함수
window.onload = async function () {
    // 접근 토큰 확인
    accessToken = getToken();
    if (!accessToken) {
      alert("로그인이 필요합니다.");
      window.location.href = "login.html";
      return;
    }
    
    // 부서 정보 가져오기
    getDepartmentName();
    
    // URL에서 공지 ID와 타입 가져오기
    const params = getNoticeParams();
    noticeId = params.id;
    noticeType = params.type;
    
    if (!noticeId || !noticeType) {
      return; // getNoticeParams 내에서 오류 처리됨
    }
    
    // 캘린더용 공지 데이터 로드
    await fetchAllNotices();
    
    // 완료 버튼 이벤트 리스너 등록 (save-notice-btn -> complete-btn으로 변경)
    document.querySelector(".complete-btn").addEventListener("click", updateNotice);
    
    // 취소 버튼 이벤트 리스너 등록
    document.querySelector(".cancel-btn").addEventListener("click", function() {
      window.history.back();
    });
    
    // 수정할 공지 데이터 로드
    const noticeData = await loadNoticeData(noticeId, noticeType);
    if (noticeData) {
      fillFormWithNoticeData(noticeData, noticeType);
    }
  };

// 공지 타입 위젯 선택 처리
document.querySelectorAll(".widget-items").forEach(widget => {
  widget.addEventListener("click", function() {
    // 위젯 선택 사항은 수정 페이지에서는 변경할 수 없도록 설정
    alert("공지 타입은 수정할 수 없습니다. 새로운 타입을 원하시면 새 공지를 작성해주세요.");
  });
});

// 전달 대상 선택 처리
document.querySelectorAll(".target-type-items").forEach(item => {
  item.addEventListener("click", function() {
    const checkImg = this.querySelector("img");
    const departmentName = this.querySelector("p").textContent;
    
    // 체크 상태 토글
    const isChecked = checkImg.dataset.checked === "true";
    
    if (isChecked) {
      checkImg.src = "/assets/icons/unchecked-target.svg";
      checkImg.dataset.checked = "false";
    } else {
      checkImg.src = "/assets/icons/checked-target.svg";
      checkImg.dataset.checked = "true";
    }
    
    // localStorage에 선택된 부서들 저장
    let selectedDepartments = JSON.parse(localStorage.getItem("selectedDepartments") || "[]");
    
    if (isChecked) {
      // 체크 해제된 경우 배열에서 제거
      selectedDepartments = selectedDepartments.filter(dep => dep !== departmentName);
    } else {
      // 체크된 경우 배열에 추가
      if (!selectedDepartments.includes(departmentName)) {
        selectedDepartments.push(departmentName);
      }
    }
    
    localStorage.setItem("selectedDepartments", JSON.stringify(selectedDepartments));
  });
});

// // 뒤로가기 버튼 이벤트 핸들러
// document.querySelector(".back-button").addEventListener("click", function() {
//   window.history.back();
// });

// // 위젯 설정 버튼 이벤트 핸들러
// document.querySelector(".widget-setting-btn").addEventListener("click", function() {
//   // 현재 선택된 위젯 타입에 따라 적절한 설정 페이지로 이동
//   switch (noticeType) {
//     case "vote":
//       window.location.href = "notice-setting-vote.html?edit=true";
//       break;
//     case "fee":
//       window.location.href = "notice-setting-fee.html?edit=true";
//       break;
//     case "attendance":
//       window.location.href = "notice-setting-attendance.html?edit=true";
//       break;
//     default:
//       alert("이 공지 타입에는 추가 설정이 없습니다.");
//       break;
//   }
// });
          
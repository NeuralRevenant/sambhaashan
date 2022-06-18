const backdrop = document.querySelector('.backdrop');
const sideDrawer = document.querySelector('.mobile-nav');
const menuToggle = document.querySelector('#side-menu-toggle');
const setbtn = document.getElementById('setbtn');
const audioTrack = document.getElementById('music');
const replayEl = document.getElementById('replay');
const videoEl = document.getElementById('video');

// const mobileNavEl = document.getElementById("mob__nav");

// if (mobileNavEl) {
//   document.addEventListener('click', function (e) {
//     window.scrollTo({
//       left: e.clientX + window.pageXOffset,
//       top: e.clientY + window.pageYOffset,
//       behavior: 'smooth'
//     });
//     mobileNavEl.scrollIntoView({ behavior: 'smooth' });
//   });
// }


// api calls:
async function queryRMSG() {
  const msgs = await fetch("https://sambhaashan.herokuapp.com/admin/received-messages-auto-complete")
    .then(res => res.json())
    .then(data => data.messages);
  return msgs;
}

async function querySMSG() {
  const msgs = await fetch("https://sambhaashan.herokuapp.com/admin/sent-messages-auto-complete")
    .then(res => res.json())
    .then(data => data.messages);
  return msgs;
}

async function queryUsernames() {
  const usernames = await fetch("https://sambhaashan.herokuapp.com/admin/usernames-auto-complete")
    .then(res => res.json())
    .then(data => data.usernames);
  return usernames;
}

async function queryFriends() {
  const frnds = await fetch('https://sambhaashan.herokuapp.com/admin/friends-auto-complete')
    .then(res => res.json())
    .then(data => data.friends);
  return frnds;
}

async function queryUserPosts() {
  const uPs = await fetch('https://sambhaashan.herokuapp.com/posts-autocomplete')
    .then(res => res.json())
    .then(data => data.posts);
  return uPs;
}

async function queryAllPosts() {
  const allPs = await fetch('https://sambhaashan.herokuapp.com/all-posts-autocomplete')
    .then(res => res.json())
    .then(data => data.posts);
  return allPs;
}


// auto-complete starts here
function autocomplete(inp, arr) {
  let currentFocusItem;
  inp.addEventListener("input", function (e) {
    let a, b, i, val = this.value;
    closeAllLists();
    if (!val) { return false; }
    currentFocusItem = -1;
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    this.parentNode.appendChild(a);
    for (i = 0; i < arr.length; i++) {
      if (arr[i].substr(0, val.length).toUpperCase() == val.toUpperCase()) {
        b = document.createElement("DIV");
        b.innerHTML = "<strong><span style='color:rgb(255, 196, 0);'>" + arr[i].substr(0, val.length) + "</span></strong>";
        b.innerHTML += arr[i].substr(val.length);
        b.innerHTML += "<input type='hidden' value='" + arr[i] + "'>";
        b.addEventListener("click", function (e) {
          inp.value = this.getElementsByTagName("input")[0].value;
          closeAllLists();
        });
        a.appendChild(b);
      }
    }
  });
  inp.addEventListener("keydown", function (e) {
    let x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      currentFocusItem++;
      addActive(x);
    } else if (e.keyCode == 38) { //up
      currentFocusItem--;
      addActive(x);
    } else if (e.keyCode == 13) {
      e.preventDefault(); // for enter key's default submission behavior
      if (currentFocusItem > -1) {
        if (x) x[currentFocusItem].click();
      }
    }
  });
  function addActive(x) {
    if (!x) return false;
    removeActive(x);
    if (currentFocusItem >= x.length) currentFocusItem = 0;
    if (currentFocusItem < 0) currentFocusItem = (x.length - 1);
    x[currentFocusItem].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    for (let i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    let x = document.getElementsByClassName("autocomplete-items");
    for (let i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
  document.addEventListener("click", function (e) {
    closeAllLists(e.target);
  });
}

// friends
const searchBoxFrnds = document.getElementById('search-box-frnds');
const searchBtnFrnds = document.getElementById('search-btn-frnds');
if (searchBoxFrnds) {
  (async function () {
    const frnds = await queryFriends();
    autocomplete(searchBoxFrnds, frnds);
  })();

  searchBtnFrnds.addEventListener('click', function () {
    if (searchBoxFrnds.value === "" || searchBoxFrnds.value === " ") {
      alert("Enter something in the search-box to search");
      this.type = "button";
      searchBoxFrnds.value = "";
    } else {
      // this.type = "button";
      this.type = "submit";
    }
  });
}

// usernames
const searchBoxU = document.getElementById('username');
if (searchBoxU) {
  (async function () {
    const usernames = await queryUsernames();
    autocomplete(searchBoxU, usernames);
  })();
}

// user-posts
const searchBoxUPs = document.getElementById('search-box-uposts');
const searchBtnUPs = document.getElementById('search-btn-uposts');
if (searchBoxUPs) {
  // localStorage.clear();
  (async function () {
    const uPosts = await queryUserPosts();
    // localStorage.setItem("UPS", uPosts);
    // const items = localStorage.getItem("UPS").split(",");
    // const data = new Array(items.length).fill(0).map((el, idx) => items[idx]);
    // autocomplete(searchBoxUPs, data);
    autocomplete(searchBoxUPs, uPosts);
  })();

  searchBtnUPs.addEventListener('click', function () {
    if (searchBoxUPs.value === "" || searchBoxUPs.value === " ") {
      alert("Enter something in the search-box to search");
      this.type = "button";
      searchBoxUPs.value = "";
    } else {
      // this.type = "button";
      this.type = "submit";
    }
  });
}

// all-posts 
const searchBoxAPs = document.getElementById('search-box-allposts');
const searchBtnAPs = document.getElementById('search-btn-allposts');
if (searchBoxAPs) {
  (async function () {
    const allPosts = await queryAllPosts();
    // localStorage.setItem("APS", allPosts);
    // const items = localStorage.getItem("APS").split(",");
    // const data = new Array(items.length).fill(0).map((el, idx) => items[idx]);
    autocomplete(searchBoxAPs, allPosts);
  })();

  searchBtnAPs.addEventListener('click', function () {
    if (searchBoxAPs.value === "" || searchBoxAPs.value === " ") {
      alert("Enter something in the search-box to search");
      this.type = "button";
      searchBoxAPs.value = "";
    } else {
      // this.type = "button";
      this.type = "submit";
    }
  });
}

// RMSGS
const searchBoxRMSG = document.getElementById('search-box-rmsg');
const searchBtnRMSG = document.getElementById('search-btn-rmsg');
if (searchBoxRMSG) {
  (async function () {
    const rmsgs = await queryRMSG();
    // localStorage.setItem("RMSGS", rmsgs);
    // const items = localStorage.getItem("RMSGS").split(",");
    // const data = new Array(items.length).fill(0).map((el, idx) => items[idx]);
    autocomplete(searchBoxRMSG, rmsgs);
  })();

  searchBtnRMSG.addEventListener('click', function () {
    if (searchBoxRMSG.value === "" || searchBoxRMSG.value === " ") {
      alert("Enter something in the search-box to search");
      this.type = "button";
      searchBoxRMSG.value = "";
    } else {
      // this.type = "button";
      this.type = "submit";
    }
  });
}

// SMSGS
const searchBoxSMSG = document.getElementById('search-box-smsg');
const searchBtnSMSG = document.getElementById('search-btn-smsg');
if (searchBoxSMSG) {
  // localStorage.clear();
  (async function () {
    const smsgs = await querySMSG();
    // localStorage.setItem("SMSGS", smsgs);
    // const items = localStorage.getItem("SMSGS").split(",");
    // const data = new Array(items.length).fill(0).map((el, idx) => items[idx]);
    autocomplete(searchBoxSMSG, smsgs);
  })();

  searchBtnSMSG.addEventListener('click', function () {
    if (searchBoxSMSG.value === "" || searchBoxSMSG.value === " ") {
      alert("Enter something in the search-box to search");
      this.type = "button";
      searchBoxSMSG.value = "";
    } else {
      // this.type = "button";
      this.type = "submit";
    }
  });
}


// for file-uploads in posts
const fi = document.getElementById('file');
if (fi) {
  // Check if any file is selected.
  fi.addEventListener('change', function () {
    if (fi.files.length > 1) {
      alert("Cannot select more than 1 file!");
      document.getElementById("file").value = "";
    } else if (fi.files[0].size > 15000000) {
      alert("File too Big! Please select a file less than 15MB.");
      document.getElementById("file").value = "";
    } else {
      const FILE_TYPES = new Set(['image/png', 'image/jpg', 'image/jpeg', 'audio/mpeg', 'audio/ogg', 'audio/wav', 'audio/x-m4a', 'audio/x-m4p', 'audio/x-m4b', 'video/mp4', 'video/webm', 'video/ogg', 'video/x-m4a', 'video/x-m4p', 'video/x-m4b']);
      // alert(fi.files[0].type);
      if (FILE_TYPES.has(fi.files[0].type)) {
        alert(`${fi.files[0].name} selected successfully!`);
      } else {
        alert("File type should be one of /png|jpg|jpeg|mpeg|ogg|wav|x-m4a|x-m4p|x-m4b|mp4|webm|ogg/");
        document.getElementById("file").value = "";
      }
    }
  });
}

if (videoEl) {
  const currentScrWidth = window.screen.width;
  if (currentScrWidth >= 1240) {
    videoEl.width = 0.45 * currentScrWidth;
    videoEl.height = 10 * (videoEl.width) / 16;
  }
  else if (currentScrWidth >= 1024) {
    videoEl.width = 0.7 * currentScrWidth;
    videoEl.height = 10 * (videoEl.width) / 16;
  } else if (currentScrWidth >= 768) {
    videoEl.width = 0.85 * currentScrWidth;
    videoEl.height = 10 * (videoEl.width) / 16;
  } else {
    videoEl.width = 0.9 * currentScrWidth;
    videoEl.height = 10 * (videoEl.width) / 16;
  }
  window.addEventListener("resize", changeSize);
  function changeSize() {
    const currentScrWidth = window.screen.width;
    const currentScrHeight = window.screen.height;
    if (currentScrWidth >= 1240) {
      videoEl.width = 0.45 * currentScrWidth;
      videoEl.height = 10 * (videoEl.width) / 16;
    }
    else if (currentScrWidth >= 1024) {
      videoEl.width = 0.7 * currentScrWidth;
      videoEl.height = 10 * (videoEl.width) / 16;
    } else if (currentScrWidth >= 768) {
      videoEl.width = 0.85 * currentScrWidth;
      videoEl.height = 10 * (videoEl.width) / 16;
    } else {
      videoEl.width = 0.9 * currentScrWidth;
      videoEl.height = 10 * (videoEl.width) / 16;
    }
  }
}

if (audioTrack) {
  audioTrack.controls = true;
  audioTrack.loop = false;
  replayEl.addEventListener('click', () => {
    audioTrack.pause();
    audioTrack.currentTime = 0;
    audioTrack.play();
  });
}

function backdropClickHandler() {
  backdrop.style.display = 'none';
  sideDrawer.classList.remove('open');
}

function menuToggleClickHandler() {
  backdrop.style.display = 'block';
  sideDrawer.classList.add('open');
}

backdrop.addEventListener('click', backdropClickHandler);
menuToggle.addEventListener('click', menuToggleClickHandler);

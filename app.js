/* ============================================================
   NAYAN CLOUD
   CLEAN APP.JS — PART 1/4
============================================================ */


/* ============================================================
   SUPABASE CONFIG
============================================================ */

const SUPABASE_URL =
  "https://pcuefhymomxaxfncskpr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PcbJ0X0yAGrDIV8M7j6ueg_AsnNbWpv";

const BUCKET =
  "cloud-files";

const USER_QUOTA =
  5 * 1024 * 1024 * 1024;


/* ============================================================
   SUPABASE CLIENT
============================================================ */

const db =
  window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce"
      }
    }
  );


/* ============================================================
   GLOBAL STATE
============================================================ */

let currentUser = null;

let files = [];

let selectedFiles = [];

let loginInProgress = false;

let objectUrls = [];


/* ============================================================
   DOM REFERENCES
============================================================ */

const loginScreen =
  document.getElementById("loginScreen");

const app =
  document.getElementById("app");

const loginBtn =
  document.getElementById("loginBtn");

const loginButtonText =
  document.getElementById("loginButtonText");

const loginLoader =
  document.getElementById("loginLoader");

const loginMessage =
  document.getElementById("loginMessage");

const logoutBtn =
  document.getElementById("logoutBtn");

const userName =
  document.getElementById("userName");

const userEmail =
  document.getElementById("userEmail");

const userAvatar =
  document.getElementById("userAvatar");

const fileGrid =
  document.getElementById("fileGrid");

const fileInput =
  document.getElementById("fileInput");

const uploadBtn =
  document.getElementById("uploadBtn");

const newUploadBtn =
  document.getElementById("newUploadBtn");

const uploadModal =
  document.getElementById("uploadModal");

const closeUploadBtn =
  document.getElementById("closeUploadBtn");

const dropZone =
  document.getElementById("dropZone");

const selectedFilesBox =
  document.getElementById("selectedFiles");

const modalUploadBtn =
  document.getElementById("modalUploadBtn");

const searchInput =
  document.getElementById("searchInput");

const refreshBtn =
  document.getElementById("refreshBtn");

const storageFill =
  document.getElementById("storageFill");

const storageText =
  document.getElementById("storageText");

const totalFiles =
  document.getElementById("totalFiles");

const totalImages =
  document.getElementById("totalImages");

const totalVideos =
  document.getElementById("totalVideos");

const totalDocuments =
  document.getElementById("totalDocuments");

const notice =
  document.getElementById("notice");

const toast =
  document.getElementById("toast");

  


/* ============================================================
   BASIC HELPERS
============================================================ */

function showLogin() {

  if (loginScreen) {
    loginScreen.classList.remove("hidden");
  }

  if (app) {
    app.classList.add("hidden");
  }

}


function showApp() {

  if (loginScreen) {
    loginScreen.classList.add("hidden");
  }

  if (app) {
    app.classList.remove("hidden");
  }

}


function setLoginMessage(
  message = "",
  isError = false
) {

  if (!loginMessage) {
    return;
  }

  loginMessage.textContent =
    message;

  loginMessage.style.color =
    isError
      ? "#ff6d8d"
      : "";

}


function hideNotice() {

  if (notice) {
    notice.classList.add("hidden");
  }

}


function showNotice(
  message,
  isError = false
) {

  if (!notice) {
    return;
  }

  notice.textContent =
    message;

  notice.classList.remove("hidden");

  notice.classList.toggle(
    "error",
    isError
  );

}


function showToast(
  message
) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.classList.remove("hidden");

  clearTimeout(
    showToast.timer
  );

  showToast.timer =
    setTimeout(
      () => {
        toast.classList.add(
          "hidden"
        );
      },
      3000
    );

}


/* ============================================================
   PREVIEW CLEANUP
============================================================ */

function cleanupPreviews() {

  objectUrls.forEach(
    (url) => {
      try {
        URL.revokeObjectURL(url);
      } catch (_) {}
    }
  );

  objectUrls = [];

}


/* ============================================================
   USER UI
============================================================ */

function updateUserUI(
  user
) {

  if (!user) {
    return;
  }

  const metadata =
    user.user_metadata || {};

  const name =
    metadata.full_name ||
    metadata.name ||
    user.email ||
    "Account";

  const avatar =
    metadata.avatar_url ||
    metadata.picture ||
    "";

  if (userName) {
    userName.textContent =
      name;
  }

  if (userEmail) {
    userEmail.textContent =
      user.email || "";
  }

  if (
    userAvatar &&
    avatar
  ) {
    userAvatar.src =
      avatar;
  }

}


/* ============================================================
   FILE TYPE
============================================================ */

function getFileType(
  file
) {

  const type =
    file?.mime_type ||
    file?.type ||
    "";

  if (
    type.startsWith("image/")
  ) {
    return "IMAGE";
  }

  if (
    type.startsWith("video/")
  ) {
    return "VIDEO";
  }

  if (
    type.includes("pdf")
  ) {
    return "PDF";
  }

  if (
    type.includes("word") ||
    type.includes("document")
  ) {
    return "DOC";
  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel")
  ) {
    return "XLS";
  }

  if (
    type.includes("zip") ||
    type.includes("rar")
  ) {
    return "ZIP";
  }

  return "FILE";

}


/* ============================================================
   FORMAT SIZE
============================================================ */

function formatBytes(
  bytes = 0
) {

  if (!bytes) {
    return "0 B";
  }

  const units = [
    "B",
    "KB",
    "MB",
    "GB",
    "TB"
  ];

  const index =
    Math.floor(
      Math.log(bytes) /
      Math.log(1024)
    );

  const safeIndex =
    Math.min(
      index,
      units.length - 1
    );

  return (
    bytes /
    Math.pow(
      1024,
      safeIndex
    )
  ).toFixed(
    safeIndex === 0
      ? 0
      : 1
  ) +
    " " +
    units[safeIndex];
}


/* ============================================================
   ENTER APP
============================================================ */

async function enterApp(
  user
) {

  if (!user) {
    return;
  }

  currentUser =
    user;

  updateUserUI(
    user
  );

  showApp();

  await loadFiles();

}


/* ============================================================
   CLEAR APP
============================================================ */

function clearApp() {

  currentUser =
    null;

  files =
    [];

  selectedFiles =
    [];

  cleanupPreviews();

  if (fileGrid) {
    fileGrid.innerHTML =
      "";
  }

  if (userName) {
    userName.textContent =
      "Account";
  }

  if (userEmail) {
    userEmail.textContent =
      "";
  }

  if (userAvatar) {
    userAvatar.removeAttribute(
      "src"
    );
  }

  closeUploadModal();

  showLogin();

  resetLoginButton();

}


/* ============================================================
   GOOGLE LOGIN
============================================================ */

async function loginWithGoogle() {

  if (loginInProgress) {
    return;
  }

  loginInProgress =
    true;

  setLoginMessage("");

  if (loginBtn) {
    loginBtn.disabled =
      true;
  }

  if (loginButtonText) {
    loginButtonText.textContent =
      "Connecting...";
  }

  loginLoader?.classList.remove(
    "hidden"
  );


  try {

    const redirectTo =
      window.location.origin +
      window.location.pathname;


    const {
      error
    } =
      await db.auth.signInWithOAuth({
        provider: "google",

        options: {
          redirectTo,

          queryParams: {
            access_type: "offline",
            prompt: "select_account"
          }
        }
      });


    if (error) {

      console.error(
        "Google OAuth error:",
        error
      );

      setLoginMessage(
        error.message ||
        "Google login failed.",
        true
      );

      resetLoginButton();

    }

  } catch (error) {

    console.error(
      "Google login exception:",
      error
    );

    setLoginMessage(
      error.message ||
      "Unable to start Google login.",
      true
    );

    resetLoginButton();

  }

}


/* ============================================================
   RESET LOGIN BUTTON
============================================================ */

function resetLoginButton() {

  loginInProgress =
    false;

  if (loginBtn) {
    loginBtn.disabled =
      false;
  }

  if (loginButtonText) {
    loginButtonText.textContent =
      "Continue with Google";
  }

  loginLoader?.classList.add(
    "hidden"
  );

}


/* ============================================================
   PART 1 END
============================================================ */
/* ============================================================
   NAYAN CLOUD
   CLEAN APP.JS — PART 2/4
   FILES + STORAGE + UPLOAD + DOWNLOAD + DELETE
============================================================ */


/* ============================================================
   LOAD FILES
============================================================ */

async function loadFiles() {

  if (!currentUser) {
    return;
  }

  hideNotice();
  cleanupPreviews();

  try {

    const {
      data,
      error
    } = await db
      .from("user_files")
      .select(
        "id,user_id,file_name,object_path,mime_type,file_size,created_at"
      )
      .eq(
        "user_id",
        currentUser.id
      )
      .order(
        "created_at",
        {
          ascending: false
        }
      );

    if (error) {

      console.error(
        "Database error:",
        error
      );

      showNotice(
        "Could not load files: " +
        error.message,
        true
      );

      return;
    }

    files =
      data || [];

    updateStorage();
    updateCounts();
    renderFiles();

  } catch (error) {

    console.error(
      "Load files error:",
      error
    );

    showNotice(
      "Could not load files.",
      true
    );

  }

}


/* ============================================================
   STORAGE
============================================================ */

function updateStorage() {

  const used =
    files.reduce(
      (
        total,
        file
      ) =>
        total +
        Number(
          file.file_size || 0
        ),
      0
    );

  const percent =
    Math.min(
      100,
      (
        used /
        USER_QUOTA
      ) * 100
    );

  if (storageFill) {
    storageFill.style.width =
      percent + "%";
  }

  if (storagePercent) {
    storagePercent.textContent =
      percent.toFixed(2) + "%";
  }

  if (storageUsed) {
    storageUsed.textContent =
      formatSize(used);
  }

}


/* ============================================================
   FILE COUNTS
============================================================ */

function updateCounts() {

  const images =
    files.filter(
      file =>
        getCategory(file) ===
        "images"
    ).length;

  const videos =
    files.filter(
      file =>
        getCategory(file) ===
        "videos"
    ).length;

  const documents =
    files.filter(
      file =>
        getCategory(file) ===
        "documents"
    ).length;


  if (allCount) {
    allCount.textContent =
      files.length;
  }

  if (imageCount) {
    imageCount.textContent =
      images;
  }

  if (videoCount) {
    videoCount.textContent =
      videos;
  }

  if (documentCount) {
    documentCount.textContent =
      documents;
  }

}


/* ============================================================
   RENDER FILES
============================================================ */

function renderFiles() {

  if (!fileGrid) {
    return;
  }

  cleanupPreviews();

  const query =
    (
      searchInput?.value ||
      ""
    )
      .trim()
      .toLowerCase();


  const filtered =
    files.filter(
      file => {

        const categoryMatch =
          currentView === "all" ||
          getCategory(file) ===
          currentView;

        const searchMatch =
          (
            file.file_name ||
            ""
          )
            .toLowerCase()
            .includes(
              query
            );

        return (
          categoryMatch &&
          searchMatch
        );

      }
    );


  fileGrid.innerHTML =
    "";


  if (fileCount) {

    fileCount.textContent =
      filtered.length +
      (
        filtered.length === 1
          ? " item"
          : " items"
      );

  }


  if (emptyState) {

    emptyState.classList.toggle(
      "hidden",
      filtered.length !== 0
    );

  }


  filtered.forEach(
    (
      file,
      index
    ) => {

      createFileCard(
        file,
        index
      );

    }
  );

}


/* ============================================================
   FILE CARD
============================================================ */

function createFileCard(
  file,
  index
) {

  const card =
    document.createElement(
      "article"
    );

  card.className =
    "file-card";

  card.style.animationDelay =
    Math.min(
      index * 0.04,
      0.5
    ) + "s";


  /* PREVIEW */

  const preview =
    document.createElement(
      "div"
    );

  preview.className =
    "file-preview";


  const category =
    getCategory(file);


  if (
    category ===
    "images"
  ) {

    const img =
      document.createElement(
        "img"
      );

    img.alt =
      file.file_name;

    img.loading =
      "lazy";

    preview.appendChild(
      img
    );

    createSignedPreview(
      file.object_path,
      img
    );

  }

  else if (
    category ===
    "videos"
  ) {

    const video =
      document.createElement(
        "video"
      );

    video.muted =
      true;

    video.preload =
      "metadata";

    video.playsInline =
      true;

    preview.appendChild(
      video
    );

    createSignedPreview(
      file.object_path,
      video
    );

  }

  else {

    const icon =
      document.createElement(
        "div"
      );

    icon.className =
      "document-icon";

    icon.textContent =
      getIcon(file);

    preview.appendChild(
      icon
    );

  }


  /* NAME */

  const name =
    document.createElement(
      "div"
    );

  name.className =
    "file-name";

  name.textContent =
    file.file_name;

  name.title =
    file.file_name;


  /* META */

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "file-meta";

  meta.textContent =
    formatSize(
      file.file_size
    );


  /* ACTIONS */

  const actions =
    document.createElement(
      "div"
    );

  actions.className =
    "file-actions";


  const download =
    document.createElement(
      "button"
    );

  download.type =
    "button";

  download.textContent =
    "Download";

  download.addEventListener(
    "click",
    () =>
      downloadFile(file)
  );


  const remove =
    document.createElement(
      "button"
    );

  remove.type =
    "button";

  remove.textContent =
    "Delete";

  remove.className =
    "delete-btn";

  remove.addEventListener(
    "click",
    () =>
      deleteFile(file)
  );


  actions.append(
    download,
    remove
  );


  card.append(
    preview,
    name,
    meta,
    actions
  );


  fileGrid.appendChild(
    card
  );

}


/* ============================================================
   SIGNED PREVIEW
============================================================ */

async function createSignedPreview(
  path,
  element
) {

  try {

    const {
      data,
      error
    } = await db.storage
      .from(BUCKET)
      .createSignedUrl(
        path,
        300
      );


    if (
      error ||
      !data?.signedUrl
    ) {

      console.error(
        "Preview error:",
        error
      );

      return;
    }


    element.src =
      data.signedUrl;


  } catch (error) {

    console.error(
      "Preview exception:",
      error
    );

  }

}


/* ============================================================
   UPLOAD MODAL
============================================================ */

function openUploadModal() {

  if (!currentUser) {
    return;
  }

  selectedFiles =
    [];

  renderSelectedFiles();

  uploadModal?.classList.remove(
    "hidden"
  );

}


function closeUploadModal() {

  uploadModal?.classList.add(
    "hidden"
  );

  selectedFiles =
    [];

  renderSelectedFiles();

}


/* ============================================================
   SELECTED FILES
============================================================ */

function renderSelectedFiles() {

  if (!selectedFilesBox) {
    return;
  }

  selectedFilesBox.innerHTML =
    "";


  if (
    !selectedFiles.length
  ) {

    if (modalUploadBtn) {
      modalUploadBtn.disabled =
        true;
    }

    return;
  }


  selectedFiles.forEach(
    file => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "selected-file";


      const icon =
        document.createElement(
          "span"
        );

      icon.textContent =
        file.type.startsWith(
          "image/"
        )
          ? "▧"
          : file.type.startsWith(
              "video/"
            )
            ? "▷"
            : "▤";


      const name =
        document.createElement(
          "span"
        );

      name.textContent =
        file.name;


      const size =
        document.createElement(
          "span"
        );

      size.textContent =
        formatSize(
          file.size
        );


      row.append(
        icon,
        name,
        size
      );

      selectedFilesBox.appendChild(
        row
      );

    }
  );


  if (modalUploadBtn) {
    modalUploadBtn.disabled =
      false;
  }

}


/* ============================================================
   ADD SELECTED FILES
============================================================ */

function addSelectedFiles(
  newFiles
) {

  const incoming =
    Array.from(
      newFiles || []
    );


  selectedFiles = [
    ...selectedFiles,
    ...incoming
  ];


  const unique =
    new Map();


  selectedFiles.forEach(
    file => {

      const key =
        [
          file.name,
          file.size,
          file.lastModified
        ].join("|");

      unique.set(
        key,
        file
      );

    }
  );


  selectedFiles =
    Array.from(
      unique.values()
    );


  renderSelectedFiles();

}


/* ============================================================
   UPLOAD FILES
============================================================ */

async function uploadFiles(
  filesToUpload
) {

  if (
    !currentUser ||
    !filesToUpload?.length
  ) {
    return;
  }


  hideNotice();


  const totalSize =
    filesToUpload.reduce(
      (
        sum,
        file
      ) =>
        sum +
        file.size,
      0
    );


  const used =
    files.reduce(
      (
        sum,
        file
      ) =>
        sum +
        Number(
          file.file_size || 0
        ),
      0
    );


  if (
    used +
    totalSize >
    USER_QUOTA
  ) {

    showToast(
      "This upload exceeds your storage allowance.",
      true
    );

    return;
  }


  uploadProgress?.classList.remove(
    "hidden"
  );


  let completed =
    0;

  const errors =
    [];


  for (
    const file
    of filesToUpload
  ) {

    if (
      file.size >
      MAX_FILE_SIZE
    ) {

      errors.push(
        file.name +
        " is larger than the allowed file size."
      );

      continue;
    }


    const path =
      currentUser.id +
      "/" +
      crypto.randomUUID() +
      "-" +
      safeName(
        file.name
      );


    if (progressText) {

      progressText.textContent =
        "Uploading " +
        file.name;

    }


    updateProgress(
      Math.round(
        (
          completed /
          filesToUpload.length
        ) * 100
      )
    );


    try {

      const {
        error:
          uploadError
      } = await db.storage
        .from(BUCKET)
        .upload(
          path,
          file,
          {
            contentType:
              file.type ||
              "application/octet-stream",

            upsert:
              false,

            cacheControl:
              "3600"
          }
        );


      if (uploadError) {

        console.error(
          "Storage upload error:",
          uploadError
        );

        errors.push(
          file.name +
          ": " +
          uploadError.message
        );

        continue;
      }


      const {
        error:
          recordError
      } = await db
        .from("user_files")
        .insert({

          user_id:
            currentUser.id,

          file_name:
            file.name,

          object_path:
            path,

          mime_type:
            file.type ||
            "application/octet-stream",

          file_size:
            file.size

        });


      if (recordError) {

        console.error(
          "Database record error:",
          recordError
        );


        await db.storage
          .from(BUCKET)
          .remove([
            path
          ]);


        errors.push(
          file.name +
          ": " +
          recordError.message
        );

        continue;
      }


      completed++;


      updateProgress(
        Math.round(
          (
            completed /
            filesToUpload.length
          ) * 100
        )
      );


    } catch (error) {

      console.error(
        "Upload exception:",
        error
      );

      errors.push(
        file.name +
        ": " +
        error.message
      );

    }

  }


  updateProgress(
    100
  );


  if (progressText) {
    progressText.textContent =
      "Upload finished.";
  }


  setTimeout(
    () => {

      uploadProgress?.classList.add(
        "hidden"
      );

    },
    700
  );


  if (errors.length) {

    showToast(
      errors.join(" | "),
      true
    );

  } else {

    showToast(
      completed +
      (
        completed === 1
          ? " file uploaded successfully."
          : " files uploaded successfully."
      )
    );

  }


  if (fileInput) {
    fileInput.value =
      "";
  }


  closeUploadModal();

  await loadFiles();

}


/* ============================================================
   PROGRESS
============================================================ */

function updateProgress(
  percent
) {

  const safePercent =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) || 0
      )
    );


  if (progressFill) {
    progressFill.style.width =
      safePercent + "%";
  }


  if (progressPercent) {
    progressPercent.textContent =
      safePercent + "%";
  }

}


/* ============================================================
   DOWNLOAD
============================================================ */

async function downloadFile(
  file
) {

  try {

    showToast(
      "Preparing download..."
    );


    const {
      data,
      error
    } = await db.storage
      .from(BUCKET)
      .createSignedUrl(
        file.object_path,
        60
      );


    if (
      error ||
      !data?.signedUrl
    ) {

      throw new Error(
        error?.message ||
        "Could not create download link."
      );

    }


    const link =
      document.createElement(
        "a"
      );


    link.href =
      data.signedUrl;

    link.download =
      file.file_name;

    link.target =
      "_blank";

    link.rel =
      "noopener";


    document.body.appendChild(
      link
    );

    link.click();

    link.remove();


  } catch (error) {

    console.error(
      "Download error:",
      error
    );

    showToast(
      "Download failed: " +
      error.message,
      true
    );

  }

}


/* ============================================================
   DELETE
============================================================ */

async function deleteFile(
  file
) {

  const confirmed =
    window.confirm(
      "Permanently delete " +
      file.file_name +
      "?"
    );


  if (!confirmed) {
    return;
  }


  try {

    showToast(
      "Deleting file..."
    );


    const {
      error:
        storageError
    } = await db.storage
      .from(BUCKET)
      .remove([
        file.object_path
      ]);


    if (storageError) {

      throw new Error(
        storageError.message
      );

    }


    const {
      error:
        databaseError
    } = await db
      .from("user_files")
      .delete()
      .eq(
        "id",
        file.id
      )
      .eq(
        "user_id",
        currentUser.id
      );


    if (databaseError) {

      throw new Error(
        databaseError.message
      );

    }


    showToast(
      "File deleted successfully."
    );


    await loadFiles();


  } catch (error) {

    console.error(
      "Delete error:",
      error
    );

    showToast(
      "Delete failed: " +
      error.message,
      true
    );

  }

}


/* ============================================================
   PART 2 END
============================================================ */
/* ============================================================
   NAYAN CLOUD
   CLEAN APP.JS — PART 3/4
   NAVIGATION + AUTH
============================================================ */


/* ============================================================
   NAVIGATION
============================================================ */

function setupNavigation() {

  document
    .querySelectorAll(".nav-item")
    .forEach(
      (button) => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(".nav-item")
              .forEach(
                (item) => {

                  item.classList.remove(
                    "active"
                  );

                }
              );


            button.classList.add(
              "active"
            );


            currentView =
              button.dataset.view ||
              "all";


            const titles = {

              all:
                "All files",

              images:
                "Photos",

              videos:
                "Videos",

              documents:
                "Documents"

            };


            const title =
              titles[currentView] ||
              "All files";


            if (viewTitle) {

              viewTitle.textContent =
                title;

            }


            if (sectionTitle) {

              sectionTitle.textContent =
                currentView === "all"
                  ? "Your files"
                  : title;

            }


            renderFiles();

          }
        );

      }
    );

}


/* ============================================================
   KEYBOARD SHORTCUTS
============================================================ */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    (event) => {

      /* U = Upload */

      if (
        event.key.toLowerCase() ===
        "u" &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey &&
        document.activeElement?.tagName !==
          "INPUT"
      ) {

        if (currentUser) {
          openUploadModal();
        }

      }


      /* Escape = Close modal */

      if (
        event.key ===
        "Escape"
      ) {

        closeUploadModal();

      }


      /* Ctrl/Cmd + K = Search */

      if (
        (
          event.ctrlKey ||
          event.metaKey
        ) &&
        event.key.toLowerCase() ===
        "k"
      ) {

        event.preventDefault();

        searchInput?.focus();

      }

    }
  );

}


/* ============================================================
   AUTH INITIALIZATION
============================================================ */

async function initializeAuth() {

  console.log(
    "NAYAN CLOUD: Initializing authentication..."
  );
/*
  Show the login screen while Supabase checks
  whether an existing session is available.
*/
showLogin();

  try {

    const {
      data,
      error
    } = await db.auth.getSession();


    if (error) {

      console.error(
        "Session error:",
        error
      );

      showLogin();

      setLoginMessage(
        "Session could not be restored.",
        true
      );

      return;

    }


    const session =
      data?.session;


    if (
      session?.user
    ) {

      console.log(
        "Existing session:",
        session.user.email
      );


      await enterApp(
        session.user
      );

    } else {

      console.log(
        "No active session."
      );

      showLogin();

    }


  } catch (error) {

    console.error(
      "Auth initialization error:",
      error
    );

    showLogin();

    setLoginMessage(
      "Authentication initialization failed.",
      true
    );

  }

}


/* ============================================================
   AUTH STATE LISTENER
============================================================ */

function setupAuthListener() {

  db.auth.onAuthStateChange(
    async (
      event,
      session
    ) => {

      console.log(
        "Supabase auth event:",
        event
      );


      /* --------------------------------
         SIGNED IN
      -------------------------------- */

      if (
        event ===
        "SIGNED_IN"
      ) {

        if (
          session?.user
        ) {

          resetLoginButton();

          await enterApp(
            session.user
          );

        }

        return;

      }


      /* --------------------------------
         TOKEN REFRESH
      -------------------------------- */

      if (
        event ===
        "TOKEN_REFRESHED"
      ) {

        if (
          session?.user
        ) {

          currentUser =
            session.user;

          updateUserUI(
            session.user
          );

        }

        return;

      }


      /* --------------------------------
         SIGNED OUT
      -------------------------------- */

      if (
        event ===
        "SIGNED_OUT"
      ) {

        clearApp();

        return;

      }

    }
  );

}


/* ============================================================
   START APPLICATION
============================================================ */

async function startApplication() {

  setupNavigation();

  setupKeyboardShortcuts();

  setupAuthListener();

  await initializeAuth();

}


/* ============================================================
   PART 3 END
============================================================ */
/* ============================================================
   NAYAN CLOUD
   CLEAN APP.JS — PART 4/4
   EVENT LISTENERS + START
============================================================ */


/* ============================================================
   LOGIN BUTTON
   IMPORTANT:
   Google login listener ONLY EXISTS HERE
============================================================ */

function setupLoginButton() {

  if (!loginBtn) {

    console.error(
      "NAYAN CLOUD: loginBtn not found."
    );

    return;

  }


  /*
    Prevent duplicate event binding.
  */

  if (
    loginBtn.dataset.bound ===
    "true"
  ) {

    return;

  }


  loginBtn.dataset.bound =
    "true";


  loginBtn.addEventListener(
    "click",
    loginWithGoogle
  );

}


/* ============================================================
   LOGOUT BUTTON
============================================================ */

function setupLogoutButton() {

  if (!logoutBtn) {
    return;
  }


  if (
    logoutBtn.dataset.bound ===
    "true"
  ) {

    return;

  }


  logoutBtn.dataset.bound =
    "true";


  logoutBtn.addEventListener(
    "click",
    async () => {

      try {

        logoutBtn.disabled =
          true;


        const {
          error
        } =
          await db.auth.signOut();


        if (error) {

          console.error(
            "Logout error:",
            error
          );

          showToast(
            "Sign out failed: " +
            error.message,
            true
          );

          logoutBtn.disabled =
            false;

          return;

        }


        clearApp();


      } catch (error) {

        console.error(
          "Logout exception:",
          error
        );

        showToast(
          "Sign out failed.",
          true
        );

        logoutBtn.disabled =
          false;

      }

    }
  );

}


/* ============================================================
   UPLOAD BUTTON
============================================================ */

function setupUploadButtons() {

  const uploadBtn =
    document.getElementById("uploadBtn");

  const emptyUploadBtn =
    document.getElementById("emptyUploadBtn");

  const newUploadBtn =
    document.getElementById("newUploadBtn");


  uploadBtn?.addEventListener(
    "click",
    openUploadModal
  );


  emptyUploadBtn?.addEventListener(
    "click",
    openUploadModal
  );


  newUploadBtn?.addEventListener(
    "click",
    openUploadModal
  );

}


/* ============================================================
   FILE INPUT
============================================================ */

function setupFileInput() {

  fileInput?.addEventListener(
    "change",
    (event) => {

      addSelectedFiles(
        event.target.files
      );

    }
  );

}


/* ============================================================
   DROP ZONE
============================================================ */

function setupDropZone() {

  if (!dropZone) {
    return;
  }


  /*
    Click to choose files
  */

  dropZone.addEventListener(
    "click",
    () => {

      fileInput?.click();

    }
  );


  /*
    Drag enter
  */

  dropZone.addEventListener(
    "dragenter",
    (event) => {

      event.preventDefault();

      dropZone.classList.add(
        "dragover"
      );

    }
  );


  /*
    Drag over
  */

  dropZone.addEventListener(
    "dragover",
    (event) => {

      event.preventDefault();

      dropZone.classList.add(
        "dragover"
      );

    }
  );


  /*
    Drag leave
  */

  dropZone.addEventListener(
    "dragleave",
    (event) => {

      event.preventDefault();

      dropZone.classList.remove(
        "dragover"
      );

    }
  );


  /*
    Drop
  */

  dropZone.addEventListener(
    "drop",
    (event) => {

      event.preventDefault();

      dropZone.classList.remove(
        "dragover"
      );


      addSelectedFiles(
        event.dataTransfer.files
      );

    }
  );

}


/* ============================================================
   UPLOAD MODAL
============================================================ */

function setupUploadModal() {

  const modalUploadBtn =
    document.getElementById("modalUploadBtn");

  const closeUploadBtn =
    document.getElementById("closeUploadBtn");

  const modalClose =
    document.getElementById("modalClose");

  const modalBackdrop =
    document.getElementById("modalBackdrop");


  modalUploadBtn?.addEventListener(
    "click",
    async () => {

      if (!selectedFiles.length) {
        return;
      }

      modalUploadBtn.disabled = true;

      try {

        await uploadFiles(
          selectedFiles
        );

      } catch (error) {

        console.error(
          "Upload error:",
          error
        );

      } finally {

        modalUploadBtn.disabled = false;

      }

    }
  );


  closeUploadBtn?.addEventListener(
    "click",
    closeUploadModal
  );


  modalClose?.addEventListener(
    "click",
    closeUploadModal
  );


  modalBackdrop?.addEventListener(
    "click",
    closeUploadModal
  );

}

/* ============================================================
   REFRESH
============================================================ */

function setupRefreshButton() {

  refreshBtn?.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }


      refreshBtn.style.transform =
        "rotate(360deg)";


      try {

        await loadFiles();

      } finally {

        setTimeout(
          () => {

            refreshBtn.style.transform =
              "";

          },
          350
        );

      }

    }
  );

}


/* ============================================================
   SEARCH
============================================================ */

function setupSearch() {

  searchInput?.addEventListener(
    "input",
    renderFiles
  );

}


/* ============================================================
   GLOBAL UI EVENTS
============================================================ */

function setupUIEvents() {

  setupLoginButton();

  setupLogoutButton();

  setupUploadButtons();

  setupFileInput();

  setupDropZone();

  setupUploadModal();

  setupRefreshButton();

  setupSearch();

}


/* ============================================================
   FINAL APPLICATION START
============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  async () => {

    console.log(
      "NAYAN CLOUD: App starting..."
    );


    try {

      setupUIEvents();

      await startApplication();


      console.log(
        "NAYAN CLOUD: App ready."
      );


    } catch (error) {

      console.error(
        "NAYAN CLOUD startup error:",
        error
      );


      showLogin();


      setLoginMessage(
        "Application failed to start: " +
        (
          error?.message ||
          "Unknown error"
        ),
        true
      );

    }

  }
);


/* ============================================================
   PART 4 END
   NAYAN CLOUD CLEAN APP.JS COMPLETE
============================================================ */

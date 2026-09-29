/* ============================================================
   NAYAN CLOUD — CLEAN APP.JS
   Upload + Google Auth + File List + Preview + Download + Delete
============================================================ */

/* ========================= CONFIG ========================= */

const SUPABASE_URL =
  "https://pcuefhymomxaxfncskpr.supabase.co";

const SUPABASE_KEY =
  "sb_publishable_PcbJ0X0yAGrDIV8M7j6ueg_AsnNbWpv";

const BUCKET =
  "cloud-files";

const USER_QUOTA =
  500 * 1024 * 1024 * 1024; // 500 GB

const MAX_FILE_SIZE =
  500 * 1024 * 1024; // 500 MB per file


/* ========================= SUPABASE ======================== */

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


/* ========================= STATE =========================== */

let currentUser = null;

let files = [];

let selectedFiles = [];

let loginInProgress = false;

let objectUrls = [];

let currentView = "all";


/* ========================= DOM ============================= */

const loginScreen =
  document.getElementById("loginScreen");

const app =
  document.getElementById("appScreen");

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

const emptyUploadBtn =
  document.getElementById("emptyUploadBtn");

const uploadModal =
  document.getElementById("uploadModal");

const closeUploadModalBtn =
  document.getElementById(
    "closeUploadModal"
  );

const modalBackdrop =
  document.getElementById(
    "modalBackdrop"
  );

const dropZone =
  document.getElementById("dropZone");

const dropFileInput =
  document.getElementById(
    "dropFileInput"
  );

const selectedFilesBox =
  document.getElementById(
    "selectedFiles"
  );

const modalUploadBtn =
  document.getElementById(
    "modalUploadBtn"
  );

const searchInput =
  document.getElementById(
    "searchInput"
  );

const refreshBtn =
  document.getElementById(
    "refreshBtn"
  );

const storageFill =
  document.getElementById(
    "storageFill"
  );

const storagePercent =
  document.getElementById(
    "storagePercent"
  );

const storageText =
  document.getElementById(
    "storageText"
  );

const allCount =
  document.getElementById(
    "allCount"
  );

const imageCount =
  document.getElementById(
    "imageCount"
  );

const videoCount =
  document.getElementById(
    "videoCount"
  );

const documentCount =
  document.getElementById(
    "documentCount"
  );

const viewTitle =
  document.getElementById(
    "viewTitle"
  );

const sectionTitle =
  document.getElementById(
    "sectionTitle"
  );

const fileCount =
  document.getElementById(
    "fileCount"
  );

const emptyState =
  document.getElementById(
    "emptyState"
  );

const notice =
  document.getElementById(
    "notice"
  );

const toast =
  document.getElementById(
    "toast"
  );

const uploadProgress =
  document.getElementById(
    "uploadProgress"
  );

const progressText =
  document.getElementById(
    "progressText"
  );

const progressPercent =
  document.getElementById(
    "progressPercent"
  );

const progressFill =
  document.getElementById(
    "progressFill"
  );


/* ========================= HELPERS ========================= */

function showLogin() {

  loginScreen?.classList.remove(
    "hidden"
  );

  app?.classList.add(
    "hidden"
  );

}


function showApp() {

  loginScreen?.classList.add(
    "hidden"
  );

  app?.classList.remove(
    "hidden"
  );

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

  notice?.classList.add(
    "hidden"
  );

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

  notice.classList.remove(
    "hidden"
  );

  notice.classList.toggle(
    "error",
    isError
  );

}


function showToast(
  message,
  isError = false
) {

  if (!toast) {
    return;
  }

  toast.textContent =
    message;

  toast.dataset.type =
    isError
      ? "error"
      : "success";

  toast.classList.remove(
    "hidden"
  );

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
      4000
    );

}


function errorMessage(
  error,
  fallback = "Something went wrong."
) {

  return (
    error?.message ||
    error?.error_description ||
    error?.description ||
    fallback
  );

}


function cleanupPreviews() {

  objectUrls.forEach(
    (url) => {

      try {

        URL.revokeObjectURL(
          url
        );

      } catch (_) {}

    }
  );

  objectUrls = [];

}


function formatBytes(
  bytes = 0
) {

  const value =
    Number(bytes) || 0;

  if (value <= 0) {
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
    Math.min(
      Math.floor(
        Math.log(value) /
        Math.log(1024)
      ),
      units.length - 1
    );

  return (
    (
      value /
      Math.pow(
        1024,
        index
      )
    ).toFixed(
      index === 0
        ? 0
        : 1
    ) +
    " " +
    units[index]
  );

}


/* Compatibility with older code */
function formatSize(
  bytes = 0
) {

  return formatBytes(
    bytes
  );

}


function safeName(
  name = "file"
) {

  return String(name)
    .replace(
      /[\\/:*?"<>|]+/g,
      "_"
    )
    .replace(
      /\s+/g,
      " "
    )
    .trim()
    .slice(
      0,
      240
    ) || "file";

}


function getCategory(
  file
) {

  const type =
    String(
      file?.mime_type ||
      file?.type ||
      ""
    ).toLowerCase();

  if (
    type.startsWith(
      "image/"
    )
  ) {

    return "images";

  }

  if (
    type.startsWith(
      "video/"
    )
  ) {

    return "videos";

  }

  return "documents";

}


function getIcon(
  file
) {

  const type =
    String(
      file?.mime_type ||
      file?.type ||
      ""
    ).toLowerCase();

  if (
    type.startsWith(
      "image/"
    )
  ) {

    return "🖼️";

  }

  if (
    type.startsWith(
      "video/"
    )
  ) {

    return "🎬";

  }

  if (
    type.includes("pdf")
  ) {

    return "📕";

  }

  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    type.includes("csv")
  ) {

    return "📊";

  }

  if (
    type.includes("word") ||
    type.includes("document")
  ) {

    return "📄";

  }

  if (
    type.includes("zip") ||
    type.includes("rar")
  ) {

    return "🗜️";

  }

  return "📁";

}


function getStoragePath(
  file
) {

  return (
    file?.object_path ||
    ""
  );

}


function escapeHtml(
  value = ""
) {

  return String(value)
    .replace(
      /[&<>'"]/g,
      char => {

        const map = {
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          "'": "&#39;",
          "\"": "&quot;"
        };

        return map[char];

      }
    );

}


/* ========================= USER UI ========================= */

function updateUserUI(
  user
) {

  if (!user) {
    return;
  }

  const metadata =
    user.user_metadata ||
    {};

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

  if (userAvatar) {

    if (avatar) {

      userAvatar.src =
        avatar;

    } else {

      userAvatar.removeAttribute(
        "src"
      );

    }

  }

}


/* ========================= GOOGLE LOGIN ==================== */

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
      await db.auth.signInWithOAuth(
        {
          provider: "google",

          options: {

            redirectTo,

            queryParams: {

              access_type:
                "offline",

              prompt:
                "select_account"

            }

          }

        }
      );

    if (error) {

      throw error;

    }

  } catch (error) {

    console.error(
      "Google OAuth error:",
      error
    );

    setLoginMessage(
      errorMessage(
        error,
        "Google login failed."
      ),
      true
    );

    resetLoginButton();

  }

}


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


/* ========================= ENTER APP ======================= */

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


/* ========================= CLEAR APP ======================= */

function clearApp() {

  currentUser =
    null;

  files =
    [];

  selectedFiles =
    [];

  currentView =
    "all";

  cleanupPreviews();

  if (fileGrid) {

    fileGrid.innerHTML =
      "";

  }

  if (selectedFilesBox) {

    selectedFilesBox.innerHTML =
      "";

  }

  if (modalUploadBtn) {

    modalUploadBtn.disabled =
      true;

  }

  if (userName) {

    userName.textContent =
      "Account";

  }

  if (userEmail) {

    userEmail.textContent =
      "";

  }

  userAvatar?.removeAttribute(
    "src"
  );

  closeUploadModal();

  showLogin();

  resetLoginButton();

}
/* ========================= FILES =========================== */

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
    } =
      await db
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
            ascending:
              false
          }
        );

    if (error) {

      throw error;

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
      "Could not load files: " +
      errorMessage(error),
      true
    );

  }

}


/* ========================= STORAGE ========================= */

function updateStorage() {

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
      percent.toFixed(2) +
      "%";

  }

  if (storageText) {

    storageText.textContent =
      formatBytes(used) +
      " used";

  }

}


/* ========================= COUNTS ========================== */

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


/* ========================= RENDER FILES ==================== */

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

        const viewMatch =
          currentView === "all" ||
          getCategory(file) ===
            currentView;

        const name =
          String(
            file.file_name ||
            ""
          ).toLowerCase();

        return (
          viewMatch &&
          name.includes(
            query
          )
        );

      }
    );

  fileGrid.innerHTML =
    "";

  if (fileCount) {

    fileCount.textContent =
      `${filtered.length} ${
        filtered.length === 1
          ? "item"
          : "items"
      }`;

  }

  emptyState?.classList.toggle(
    "hidden",
    filtered.length !== 0
  );

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


/* ========================= FILE CARD ======================= */

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


  /* ---------- PREVIEW ---------- */

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
      file.file_name ||
      "Image";

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


  /* ---------- NAME ---------- */

  const name =
    document.createElement(
      "div"
    );

  name.className =
    "file-name";

  name.textContent =
    file.file_name ||
    "Untitled";

  name.title =
    file.file_name ||
    "Untitled";


  /* ---------- META ---------- */

  const meta =
    document.createElement(
      "div"
    );

  meta.className =
    "file-meta";

  meta.textContent =
    formatBytes(
      file.file_size
    );


  /* ---------- ACTIONS ---------- */

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


/* ========================= SIGNED PREVIEW ================== */

async function createSignedPreview(
  path,
  element
) {

  if (
    !path ||
    !element
  ) {

    return;

  }

  try {

    const {
      data,
      error
    } =
      await db.storage
        .from(BUCKET)
        .createSignedUrl(
          path,
          3600
        );

    if (
      error ||
      !data?.signedUrl
    ) {

      throw (
        error ||
        new Error(
          "Could not create preview link."
        )
      );

    }

    element.src =
      data.signedUrl;

  } catch (error) {

    console.error(
      "Preview error:",
      error
    );

  }

}


/* ========================= UPLOAD MODAL ==================== */

function openUploadModal() {

  if (!currentUser) {

    showToast(
      "Please sign in first.",
      true
    );

    return;

  }

  uploadModal?.classList.remove(
    "hidden"
  );

  uploadModal?.setAttribute(
    "aria-hidden",
    "false"
  );

  renderSelectedFiles();

}


function closeUploadModal() {

  uploadModal?.classList.add(
    "hidden"
  );

  uploadModal?.setAttribute(
    "aria-hidden",
    "true"
  );

}


/* ========================= SELECTED FILES ================== */

function renderSelectedFiles() {

  if (!selectedFilesBox) {
    return;
  }

  selectedFilesBox.innerHTML =
    "";

  selectedFiles.forEach(
    (
      file,
      index
    ) => {

      const row =
        document.createElement(
          "div"
        );

      row.className =
        "selected-file-row";

      row.innerHTML = `
        <div class="selected-file-info">
          <span class="selected-file-icon">
            ${getIcon(file)}
          </span>

          <div>
            <strong>
              ${escapeHtml(
                file.name
              )}
            </strong>

            <small>
              ${formatBytes(
                file.size
              )}
            </small>
          </div>
        </div>

        <button
          type="button"
          class="selected-file-remove"
          aria-label="Remove file"
        >
          ×
        </button>
      `;

      row
        .querySelector(
          ".selected-file-remove"
        )
        ?.addEventListener(
          "click",
          () => {

            selectedFiles.splice(
              index,
              1
            );

            renderSelectedFiles();

          }
        );

      selectedFilesBox.appendChild(
        row
      );

    }
  );

  if (modalUploadBtn) {

    modalUploadBtn.disabled =
      selectedFiles.length ===
      0;

  }

}


/* ========================= ADD FILES ======================= */

function addSelectedFiles(
  newFiles
) {

  const incoming =
    Array.from(
      newFiles || []
    );

  for (
    const file
    of incoming
  ) {

    const duplicate =
      selectedFiles.some(
        existing =>
          existing.name ===
            file.name &&
          existing.size ===
            file.size &&
          existing.lastModified ===
            file.lastModified
      );

    if (!duplicate) {

      selectedFiles.push(
        file
      );

    }

  }

  renderSelectedFiles();

  openUploadModal();

}


/* ========================= PROGRESS ======================== */

function updateProgress(
  percent
) {

  const safe =
    Math.max(
      0,
      Math.min(
        100,
        Number(percent) ||
          0
      )
    );

  if (progressFill) {

    progressFill.style.width =
      safe + "%";

  }

  if (progressPercent) {

    progressPercent.textContent =
      Math.round(safe) +
      "%";

  }

}


/* ========================= UPLOAD FILES ==================== */

async function uploadFiles(
  filesToUpload
) {

  if (!currentUser) {

    throw new Error(
      "You are not logged in."
    );

  }

  if (
    !filesToUpload?.length
  ) {

    throw new Error(
      "Please select at least one file."
    );

  }


  const totalSize =
    filesToUpload.reduce(
      (
        sum,
        file
      ) =>
        sum +
        Number(
          file.size || 0
        ),
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

    throw new Error(
      "This upload exceeds your 500 GB storage allowance."
    );

  }


  const oversized =
    filesToUpload.find(
      file =>
        Number(
          file.size || 0
        ) >
        MAX_FILE_SIZE
    );


  if (oversized) {

    throw new Error(
      `"${oversized.name}" is larger than the 500 MB limit.`
    );

  }


  uploadProgress?.classList.remove(
    "hidden"
  );


  let completed =
    0;

  const errors =
    [];


  if (modalUploadBtn) {

    modalUploadBtn.disabled =
      true;

  }


  try {

    for (
      const file
      of filesToUpload
    ) {

      if (progressText) {

        progressText.textContent =
          "Uploading " +
          file.name;

      }

      updateProgress(
        (
          completed /
          filesToUpload.length
        ) * 100
      );


      const path =
        `${currentUser.id}/${crypto.randomUUID()}-${safeName(file.name)}`;


      try {

        const {
          error:
            uploadError
        } =
          await db.storage
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

          throw uploadError;

        }


        const {
          error:
            recordError
        } =
          await db
            .from("user_files")
            .insert(
              {
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
                  Number(
                    file.size || 0
                  )

              }
            );


        if (recordError) {

          try {

            await db.storage
              .from(BUCKET)
              .remove(
                [path]
              );

          } catch (
            cleanupError
          ) {

            console.warn(
              "Storage cleanup error:",
              cleanupError
            );

          }

          throw recordError;

        }


        completed++;

        updateProgress(
          (
            completed /
            filesToUpload.length
          ) * 100
        );


      } catch (error) {

        console.error(
          "Upload error for",
          file.name,
          error
        );

        errors.push(
          `${file.name}: ${errorMessage(error)}`
        );

      }

    }


    if (progressText) {

      progressText.textContent =
        errors.length
          ? "Upload finished with errors."
          : "Upload finished.";

    }

    updateProgress(
      100
    );


    if (errors.length) {

      showToast(
        errors.join(
          " | "
        ),
        true
      );

      showNotice(
        errors.join(
          " | "
        ),
        true
      );

    } else {

      showToast(
        `${completed} ${
          completed === 1
            ? "file"
            : "files"
        } uploaded successfully.`
      );

    }


    selectedFiles =
      [];

    renderSelectedFiles();


    if (fileInput) {

      fileInput.value =
        "";

    }


    if (dropFileInput) {

      dropFileInput.value =
        "";

    }


    await loadFiles();


    setTimeout(
      () => {

        uploadProgress?.classList.add(
          "hidden"
        );

        if (!errors.length) {

          closeUploadModal();

        }

      },
      700
    );


  } finally {

    if (modalUploadBtn) {

      modalUploadBtn.disabled =
        selectedFiles.length ===
        0;

    }

  }

}


/* ========================= DOWNLOAD ======================== */

async function downloadFile(
  file
) {

  try {

    if (
      !file?.object_path
    ) {

      throw new Error(
        "File path is missing."
      );

    }

    showToast(
      "Preparing download..."
    );


    const {
      data,
      error
    } =
      await db.storage
        .from(BUCKET)
        .createSignedUrl(
          file.object_path,
          3600,
          {
            download:
              file.file_name
          }
        );


    if (
      error ||
      !data?.signedUrl
    ) {

      throw (
        error ||
        new Error(
          "Could not create download link."
        )
      );

    }


    const link =
      document.createElement(
        "a"
      );

    link.href =
      data.signedUrl;

    link.download =
      file.file_name ||
      "download";

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
      errorMessage(error),
      true
    );

  }

}


/* ========================= DELETE ========================== */

async function deleteFile(
  file
) {

  if (!currentUser) {
    return;
  }

  const confirmed =
    window.confirm(
      `Permanently delete ${file.file_name}?`
    );

  if (!confirmed) {
    return;
  }


  try {

    showToast(
      "Deleting file..."
    );


    if (file.object_path) {

      const {
        error:
          storageError
      } =
        await db.storage
          .from(BUCKET)
          .remove(
            [
              file.object_path
            ]
          );


      if (storageError) {

        throw storageError;

      }

    }


    const {
      error:
        databaseError
    } =
      await db
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

      throw databaseError;

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
      errorMessage(error),
      true
    );

  }

}
/* ========================= NAVIGATION ===================== */

function setupNavigation() {

  document
    .querySelectorAll(
      ".nav-item"
    )
    .forEach(
      button => {

        button.addEventListener(
          "click",
          () => {

            document
              .querySelectorAll(
                ".nav-item"
              )
              .forEach(
                item => {

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
              titles[
                currentView
              ] ||
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


/* ========================= KEYBOARD ======================== */

function setupKeyboardShortcuts() {

  document.addEventListener(
    "keydown",
    event => {

      const tag =
        document.activeElement?.tagName;

      const typing =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT";


      /* U = Upload */

      if (
        !typing &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.toLowerCase() ===
          "u"
      ) {

        event.preventDefault();

        openUploadModal();

      }


      /* CTRL + K = Search */

      if (
        (event.ctrlKey ||
          event.metaKey) &&
        event.key.toLowerCase() ===
          "k"
      ) {

        event.preventDefault();

        searchInput?.focus();

      }


      /* ESC = Close modal */

      if (
        event.key ===
        "Escape"
      ) {

        closeUploadModal();

      }

    }
  );

}


/* ========================= AUTH INIT ======================= */

async function initializeAuth() {

  showLogin();

  try {

    const {
      data,
      error
    } =
      await db.auth.getSession();


    if (error) {

      throw error;

    }


    if (
      data?.session?.user
    ) {

      await enterApp(
        data.session.user
      );

    }

  } catch (error) {

    console.error(
      "Auth initialization error:",
      error
    );

    setLoginMessage(
      "Authentication initialization failed: " +
      errorMessage(error),
      true
    );

  }

}


/* ========================= AUTH LISTENER =================== */

function setupAuthListener() {

  db.auth.onAuthStateChange(
    (
      event,
      session
    ) => {

      console.log(
        "Supabase auth event:",
        event
      );


      if (
        event ===
        "SIGNED_IN" &&
        session?.user
      ) {

        resetLoginButton();

        setTimeout(
          () => {

            enterApp(
              session.user
            );

          },
          0
        );

        return;

      }


      if (
        event ===
        "TOKEN_REFRESHED" &&
        session?.user
      ) {

        currentUser =
          session.user;

        updateUserUI(
          session.user
        );

        return;

      }


      if (
        event ===
        "SIGNED_OUT"
      ) {

        clearApp();

      }

    }
  );

}


/* ========================= LOGOUT ========================== */

function setupLogoutButton() {

  if (!logoutBtn) {
    return;
  }


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

          throw error;

        }


        clearApp();


      } catch (error) {

        console.error(
          "Logout error:",
          error
        );

        showToast(
          "Sign out failed: " +
          errorMessage(error),
          true
        );

        logoutBtn.disabled =
          false;

      }

    }
  );

}


/* ========================= UPLOAD BUTTONS ================ */

function setupUploadButtons() {

  uploadBtn?.addEventListener(
    "click",
    openUploadModal
  );


  newUploadBtn?.addEventListener(
    "click",
    openUploadModal
  );


  emptyUploadBtn?.addEventListener(
    "click",
    openUploadModal
  );

}


/* ========================= FILE INPUT ===================== */

function setupFileInput() {

  fileInput?.addEventListener(
    "change",
    event => {

      addSelectedFiles(
        event.target.files
      );

    }
  );


  dropFileInput?.addEventListener(
    "change",
    event => {

      addSelectedFiles(
        event.target.files
      );

    }
  );

}


/* ========================= DROP ZONE ======================= */

function setupDropZone() {

  if (!dropZone) {
    return;
  }


  dropZone.addEventListener(
    "click",
    () => {

      dropFileInput?.click();

    }
  );


  [
    "dragenter",
    "dragover"
  ].forEach(
    eventName => {

      dropZone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          event.stopPropagation();

          dropZone.classList.add(
            "dragover"
          );

        }
      );

    }
  );


  [
    "dragleave",
    "drop"
  ].forEach(
    eventName => {

      dropZone.addEventListener(
        eventName,
        event => {

          event.preventDefault();

          event.stopPropagation();

          dropZone.classList.remove(
            "dragover"
          );

        }
      );

    }
  );


  dropZone.addEventListener(
    "drop",
    event => {

      addSelectedFiles(
        event.dataTransfer?.files ||
        []
      );

    }
  );

}


/* ========================= UPLOAD MODAL ==================== */

function setupUploadModal() {

  modalUploadBtn?.addEventListener(
    "click",
    async () => {

      if (
        !selectedFiles.length
      ) {

        showToast(
          "Please select at least one file.",
          true
        );

        return;

      }


      try {

        await uploadFiles(
          [
            ...selectedFiles
          ]
        );


      } catch (error) {

        console.error(
          "Upload error:",
          error
        );


        const message =
          errorMessage(
            error,
            "Upload failed."
          );


        showToast(
          message,
          true
        );


        showNotice(
          message,
          true
        );


        uploadProgress?.classList.add(
          "hidden"
        );

      }

    }
  );


  closeUploadModalBtn?.addEventListener(
    "click",
    closeUploadModal
  );


  modalBackdrop?.addEventListener(
    "click",
    closeUploadModal
  );

}


/* ========================= REFRESH ======================== */

function setupRefreshButton() {

  refreshBtn?.addEventListener(
    "click",
    async () => {

      if (!currentUser) {
        return;
      }


      try {

        refreshBtn.style.transform =
          "rotate(360deg)";


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


/* ========================= SEARCH ========================= */

function setupSearch() {

  searchInput?.addEventListener(
    "input",
    renderFiles
  );

}


/* ========================= UI EVENTS ====================== */

function setupUIEvents() {

  setupLoginButton();

  setupLogoutButton();

  setupUploadButtons();

  setupFileInput();

  setupDropZone();

  setupUploadModal();

  setupRefreshButton();

  setupSearch();

  setupNavigation();

  setupKeyboardShortcuts();

}


/* ========================= LOGIN BUTTON =================== */

function setupLoginButton() {

  loginBtn?.addEventListener(
    "click",
    loginWithGoogle
  );

}


/* ========================= START =========================== */

async function startApplication() {

  setupAuthListener();

  await initializeAuth();

}
/* ========================= APPLICATION START ============== */

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
        errorMessage(error),
        true
      );

    }

  }
);


/* ========================= GLOBAL ERRORS =================== */

window.addEventListener(
  "unhandledrejection",
  event => {

    console.error(
      "NAYAN CLOUD unhandled rejection:",
      event.reason
    );

  }
);


window.addEventListener(
  "error",
  event => {

    console.error(
      "NAYAN CLOUD global error:",
      event.error ||
      event.message
    );

  }
);


/* ========================= END ============================= */

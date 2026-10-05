/** shared/ui/dropzone: see docs/architecture.md for responsibilities. */

export function bindDropzone(dropzoneEl, inputEl, onFile) {
  if (!dropzoneEl || !inputEl || !onFile) return;
  function stop(ev) {
    ev.preventDefault();
    ev.stopPropagation();
  }
  ['dragenter', 'dragover'].forEach(function (evtName) {
    dropzoneEl.addEventListener(evtName, function (ev) {
      stop(ev);
      dropzoneEl.classList.add('is-dragover');
    });
  });
  ['dragleave', 'dragend', 'drop'].forEach(function (evtName) {
    dropzoneEl.addEventListener(evtName, function (ev) {
      stop(ev);
      dropzoneEl.classList.remove('is-dragover');
    });
  });
  dropzoneEl.addEventListener('drop', function (ev) {
    var files =
      ev.dataTransfer && ev.dataTransfer.files
        ? Array.prototype.slice.call(ev.dataTransfer.files)
        : [];
    for (var i = 0; i < files.length; i++) {
      onFile(files[i]);
    }
  });
  dropzoneEl.addEventListener('click', function () {
    inputEl.click();
  });
  dropzoneEl.addEventListener('keydown', function (ev) {
    if (ev.key === 'Enter' || ev.key === ' ') {
      ev.preventDefault();
      inputEl.click();
    }
  });
}

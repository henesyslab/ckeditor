import _axios from "axios";
import ValidationException from "./ValidationException";

export default class UploadAdapter {
  constructor(loader, configuration, t) {
    this.loader = loader;
    this.validateConfig(configuration);
    this.configuration = configuration;
    this.t = t;
  }

  validateConfig(configuration) {
    if (typeof configuration !== "object" || configuration === null) {
      console.info("Upload adapter configuration should be an object");
      console.error("CKEditor Upload file configuration is not valid.");
    }
  }

  upload() {
    return this.loader.file.then(
      file => new Promise((resolve, reject) => {
        this.configureAxios();
        const data = this.prepareFormData(file);
        this.send(data, resolve, reject);
      })
    );
  }

  configureAxios() {
    const { headers } = this.configuration;

    if (!headers)
      console.error("CKEditor5 Upload FileAdapter : headers is not defined.");

    this.axios = _axios.create({ headers });
  }

  prepareFormData(file) {
    const data = new FormData();
    const { extraParams } = this.configuration;

    if (typeof extraParams === "object")
      Object.keys(extraParams).forEach(key => data.append(key, extraParams[key]));

    data.append("file", file);

    return data;
  }

  send(data, resolve, reject) {
    const loader = this.loader;
    const { uploadUrl } = this.configuration;

    if (!uploadUrl)
      console.error("CKEditor5 Upload FileAdapter : uploadUrl is not defined.");

    const axios = this.axios;

    const CancelToken = _axios.CancelToken;
    let cancelUpload = this.cancelUpload;

    axios
      .post(uploadUrl, data, {
        onUploadProgress: progressEvent => {
          loader.uploadTotal = progressEvent.total;
          loader.uploaded = progressEvent.loaded;
        },
        cancelToken: new CancelToken(function executor(c) {
          cancelUpload = c;
        })
      })
      .then(response => resolve({ default: response.data.data.file_url }))
      .catch(error => {
        let message = "Something went wrong. Try again later";

        if (error.response && error.response.status === 422) {
          const { message, errors } = error.response.data;
          throw new ValidationException(message, errors);
        }

        return reject(message);
      });
  }

  abort() {
    let cancelUpload = this.cancelUpload;
    cancelUpload();
  }
}

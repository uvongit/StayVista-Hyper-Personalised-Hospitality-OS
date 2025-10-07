import { useRef, useState } from "react";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import axios from "axios";
import { registerUser } from "../../api/services.js";

const PLACEHOLDER_IMAGE = "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg";

const New = ({ inputs, title }) => {
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
    setError("");
    setSuccess("");
  };

  const handleFileChange = (event) => {
    const selected = event.target.files?.[0] || null;
    setFile(selected);
    setError("");
    setSuccess("");
  };

  const resetForm = () => {
    setInfo({});
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    let imageUrl = "";

    try {
      if (file) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "upload");
        const uploadRes = await axios.post(
          "https://api.cloudinary.com/v1_1/lamadev/image/upload",
          data
        );
        imageUrl = uploadRes.data.url;
      }

      const payload = {
        ...info,
        ...(imageUrl ? { img: imageUrl } : {}),
      };

      await registerUser(payload);
      setSuccess("User created successfully.");
      resetForm();
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Failed to create user");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-6 rounded-2xl border border-border bg-surface p-6 shadow-soft dark:border-dark-border dark:bg-dark-surface">
        <div className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-text-muted dark:text-dark-text-muted">
            Directory · Create user
          </span>
          <h1 className="text-3xl font-semibold text-text-primary dark:text-dark-text-primary">
            {title}
          </h1>
          <p className="max-w-2xl text-sm text-text-muted dark:text-dark-text-muted">
            Upload an avatar and fill out the essentials so new team members can jump into StayVista instantly.
          </p>
        </div>
        <span className="text-xs text-text-muted dark:text-dark-text-muted">
          {submitting ? "Submitting user…" : success ? "User created" : "Awaiting submission"}
        </span>
      </header>

      <section className="grid gap-8 rounded-2xl border border-border bg-surface p-8 shadow-soft dark:border-dark-border dark:bg-dark-surface lg:grid-cols-[320px,1fr]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-48 w-48 overflow-hidden rounded-2xl border border-border/60 bg-background dark:border-dark-border dark:bg-dark-background">
            <img
              src={file ? URL.createObjectURL(file) : PLACEHOLDER_IMAGE}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-text-secondary transition hover:border-primary hover:text-primary dark:border-dark-border dark:text-dark-text-secondary dark:hover:border-primary dark:hover:text-primary">
            <DriveFolderUploadOutlinedIcon fontSize="small" />
            <span>Upload avatar</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
          </label>
        </div>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          {inputs.map((input) => (
            <label key={input.id} className="grid gap-1 text-sm">
              <span className="font-medium text-text-secondary dark:text-dark-text-secondary">
                {input.label}
              </span>
              <input
                id={input.id}
                type={input.type}
                placeholder={input.placeholder}
                value={info[input.id] || ""}
                onChange={handleChange}
                required={input.required ?? true}
                className="rounded-lg border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-dark-border dark:bg-dark-background dark:text-dark-text-primary"
              />
            </label>
          ))}

          {success && (
            <div className="rounded-lg border border-success/20 bg-success/10 px-4 py-2 text-sm text-success">
              {success}
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="submit"
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-primary/60"
              disabled={submitting}
            >
              {submitting ? "Creating…" : "Submit"}
            </button>
            <span className="text-xs text-text-muted dark:text-dark-text-muted">
              All fields are required unless specified otherwise.
            </span>
          </div>
        </form>
      </section>
    </div>
  );
};

export default New;

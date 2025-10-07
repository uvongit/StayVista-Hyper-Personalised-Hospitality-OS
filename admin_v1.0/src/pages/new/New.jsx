import "./new.scss";
import Sidebar from "../../components/sidebar/Sidebar";
import Navbar from "../../components/navbar/Navbar";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import { useRef, useState } from "react";
import axios from "axios";
import { registerUser } from "../../api/services";

const New = ({ inputs, title }) => {
  const [file, setFile] = useState(null);
  const [info, setInfo] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setInfo((prev) => ({ ...prev, [id]: value }));
    setError("");
    setSuccess("");
  };

  const handleClick = async (e) => {
    e.preventDefault();
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

      const newUser = {
        ...info,
        ...(imageUrl ? { img: imageUrl } : {}),
      };

      await registerUser(newUser);
      setSuccess("User created successfully.");
      setInfo({});
      setFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(
        err?.response?.data?.message || err?.message || "Failed to create user"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="new">
      <Sidebar />
      <div className="newContainer">
        <Navbar />
        <div className="top">
          <h1>{title}</h1>
          <p className="helper-text">Upload an avatar and fill out the details to add a new user.</p>
        </div>
        <div className="bottom">
          <div className="left">
            <img
              src={
                file
                  ? URL.createObjectURL(file)
                  : "https://icon-library.com/images/no-image-icon/no-image-icon-0.jpg"
              }
              alt=""
            />
          </div>
          <div className="right">
            <form>
              <div className="formInput">
                <label htmlFor="file">
                  Image: <DriveFolderUploadOutlinedIcon className="icon" />
                </label>
                <input
                  type="file"
                  id="file"
                  onChange={(e) => {
                    const selectedFile = e.target.files?.[0] || null;
                    setFile(selectedFile);
                    setError("");
                    setSuccess("");
                  }}
                  ref={fileInputRef}
                  style={{ display: "none" }}
                />
              </div>

              {inputs.map((input) => (
                <div className="formInput" key={input.id}>
                  <label>{input.label}</label>
                  <input
                    onChange={handleChange}
                    type={input.type}
                    placeholder={input.placeholder}
                    id={input.id}
                    value={info[input.id] || ""}
                    required={input.required ?? true}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={handleClick}
                className="primary-button"
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Submit"}
              </button>
              {error && <div className="errorMessage">{error}</div>}
              {success && <div className="successMessage">{success}</div>}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default New;

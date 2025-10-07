import { Link } from "react-router-dom";
import ImageCarousel from "../carousel/ImageCarousel";
import "./searchItem.css";

const SearchItem = ({ item }) => {
  const images = Array.isArray(item?.photos) && item.photos.length ? item.photos.filter(Boolean) : [];

  return (
    <div className="searchItem">
      <div className="siImgWrapper">
        <ImageCarousel
          images={images}
          altPrefix={item.name}
          className="siCarousel"
          aspect="1 / 1"
        />
      </div>
      <div className="siDesc">
        <h1 className="siTitle">{item.name}</h1>
        <span className="siDistance">{item.distance}m from center</span>
        <span className="siTaxiOp">Free airport taxi</span>
        <span className="siSubtitle">
          Studio Apartment with Air conditioning
        </span>
        <span className="siFeatures">{item.desc}</span>
        <span className="siCancelOp">Free cancellation </span>
        <span className="siCancelOpSubtitle">
          You can cancel later, so lock in this great price today!
        </span>
      </div>
      <div className="siDetails">
        {item.rating && <div className="siRating">
          <span>Excellent</span>
          <button>{item.rating}</button>
        </div>}
        <div className="siDetailTexts">
          <span className="siPrice">₹{item.cheapestPrice}</span>
          <span className="siTaxOp">Includes taxes and fees</span>
          <Link to={`/hotels/${item._id}`}>
          <button className="siCheckButton">See availability</button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SearchItem;

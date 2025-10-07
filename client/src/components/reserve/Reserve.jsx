import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleXmark } from "@fortawesome/free-solid-svg-icons";

import "./reserve.css";
import { useCallback, useContext, useEffect, useMemo, useState } from "react";
import { SearchContext } from "../../context/SearchContext";
import { useNavigate } from "react-router-dom";
import { getHotelRooms, updateRoomAvailability } from "../../api/hotels";
import { createBooking } from "../../api/bookings";

const Reserve = ({ setOpen, hotelId }) => {
  const [selectedRooms, setSelectedRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const { dates, options } = useContext(SearchContext);

  const formatCurrency = (value) =>
    typeof value === "number"
      ? value.toLocaleString("en-IN", {
          style: "currency",
          currency: "INR",
          minimumFractionDigits: 0,
        })
      : "—";

  const getDatesInRange = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start) || Number.isNaN(end)) {
      return [];
    }

    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const range = [];
    const cursor = new Date(start.getTime());

    while (cursor < end) {
      range.push(cursor.getTime());
      cursor.setDate(cursor.getDate() + 1);
    }

    return range;
  };

  const primaryRange = useMemo(() => {
    if (Array.isArray(dates) && dates.length > 0) {
      return {
        startDate: new Date(dates[0].startDate),
        endDate: new Date(dates[0].endDate || dates[0].startDate),
      };
    }

    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return { startDate: now, endDate: tomorrow };
  }, [dates]);

  const normalizedRange = useMemo(() => {
    const checkIn = new Date(primaryRange.startDate);
    const checkOutCandidate = new Date(primaryRange.endDate);
    if (checkOutCandidate <= checkIn) {
      checkOutCandidate.setDate(checkIn.getDate() + 1);
    }
    return {
      checkIn,
      checkOut: checkOutCandidate,
      alldates: getDatesInRange(checkIn, checkOutCandidate),
    };
  }, [primaryRange]);

  const stayNights = Math.max(
    1,
    Math.ceil((normalizedRange.checkOut.getTime() - normalizedRange.checkIn.getTime()) / (1000 * 60 * 60 * 24))
  );

  const formatDateParam = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const checkInParam = formatDateParam(normalizedRange.checkIn);
  const checkOutParam = formatDateParam(normalizedRange.checkOut);

  useEffect(() => {
    let isMounted = true;

    const fetchRooms = async () => {
      setLoading(true);
      try {
        const params = {};
        if (checkInParam) params.checkIn = checkInParam;
        if (checkOutParam) params.checkOut = checkOutParam;

        const response = await getHotelRooms(hotelId, params);
        if (!isMounted) return;
        const roomList = Array.isArray(response?.rooms) ? response.rooms : [];
        setRooms(roomList);
        setError(null);
      } catch (err) {
        if (!isMounted) return;
        setError(err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (hotelId) {
      fetchRooms();
    }

    return () => {
      isMounted = false;
    };
  }, [hotelId, checkInParam, checkOutParam]);

  const isAvailable = useCallback(
    (roomNumber) => {
      const isFound = roomNumber.unavailableDates.some((date) =>
        normalizedRange.alldates.includes(new Date(date).setHours(0, 0, 0, 0))
      );

      return !isFound;
    },
    [normalizedRange.alldates]
  );

  useEffect(() => {
    if (!rooms.length) {
      setSelectedRooms([]);
      return;
    }

    setSelectedRooms((prev) =>
      prev.filter((selection) => {
        const matchingRoom = rooms.find((room) => room._id === selection.roomId);
        if (!matchingRoom) return false;
        const matchingNumber = matchingRoom.roomNumbers.find(
          (roomNumber) => roomNumber._id === selection.roomNumberId
        );
        if (!matchingNumber) return false;
        const disabled = matchingNumber.isUnavailableForRange || !isAvailable(matchingNumber);
        return !disabled;
      })
    );
  }, [rooms, isAvailable]);

  const handleSelect = (event, room, roomNumber) => {
    const checked = event.target.checked;
    const selection = {
      roomId: room._id,
      roomNumberId: roomNumber._id,
      label: `${room.title} #${roomNumber.number}`,
      price: room.price,
    };

    setSelectedRooms((prev) => {
      if (checked) {
        const filtered = prev.filter((item) => item.roomNumberId !== roomNumber._id);
        return [...filtered, selection];
      }
      return prev.filter((item) => item.roomNumberId !== roomNumber._id);
    });
  };

  const navigate = useNavigate();

  const handleClick = async () => {
    if (!checkInParam || !checkOutParam) {
      setUpdateError("Please select valid stay dates before booking.");
      return;
    }

    if (!selectedRooms.length) {
      setUpdateError("Please select at least one room to continue.");
      return;
    }

    try {
      setUpdating(true);
      setUpdateError(null);

      const bookingPayload = {
        hotelId,
        checkIn: checkInParam,
        checkOut: checkOutParam,
        guests: {
          adults: Number(options?.adult) || 1,
          children: Number(options?.children) || 0,
        },
        rooms: selectedRooms.map((room) => ({
          roomId: room.roomId,
          roomNumberId: room.roomNumberId,
          label: room.label,
          price: room.price,
        })),
      };

      await createBooking(bookingPayload);

      await Promise.all(
        selectedRooms.map((room) =>
          updateRoomAvailability(room.roomNumberId, {
            dates: normalizedRange.alldates,
          })
        )
      );

      setSuccessMessage("Booking confirmed! Redirecting to your bookings...");
      setTimeout(() => {
        setOpen(false);
        navigate("/bookings");
      }, 1200);
    } catch (err) {
      const message =
        err?.response?.data?.message || err?.message || "Reservation failed. Please try again.";
      setUpdateError(message);
    } finally {
      setUpdating(false);
    }
  };
  const selectedCount = selectedRooms.length;
  const totalSelected = selectedRooms.reduce((sum, room) => sum + (room.price || 0), 0);
  const subtitle = `${stayNights} night${stayNights > 1 ? "s" : ""} · Select the rooms you need.`;

  return (
    <div className="reserve-modal" role="dialog" aria-modal="true">
      <div className="reserve-modal__dialog">
        <button
          type="button"
          className="reserve-modal__close"
          onClick={() => setOpen(false)}
          aria-label="Close reservation"
        >
          <FontAwesomeIcon icon={faCircleXmark} />
        </button>
        <header className="reserve-modal__header">
          <span className="reserve-modal__eyebrow">StayVista</span>
          <h2 className="reserve-modal__title">Choose rooms</h2>
          <p className="reserve-modal__subtitle">{subtitle}</p>
        </header>
        <div className="reserve-modal__content">
          {loading ? (
            <div className="reserve-modal__state">Loading rooms…</div>
          ) : error ? (
            <div className="reserve-modal__state reserve-modal__state--error">Unable to load rooms.</div>
          ) : rooms.length === 0 ? (
            <div className="reserve-modal__state">No rooms currently available for these dates.</div>
          ) : (
            rooms.map((item) => (
              <article className="reserve-room-card" key={item._id}>
                <header className="reserve-room-card__header">
                  <h3>{item.title}</h3>
                  <span>{formatCurrency(item.price)}</span>
                </header>
                <p className="reserve-room-card__desc">{item.desc}</p>
                <div className="reserve-room-card__meta">
                  <span>Sleeps {item.maxPeople}</span>
                  <span>Flexible cancellation</span>
                </div>
                <div className="reserve-room-card__options">
                  {item.roomNumbers.map((roomNumber) => {
                    const disabled = roomNumber.isUnavailableForRange || !isAvailable(roomNumber);
                    const checked = selectedRooms.some((room) => room.roomNumberId === roomNumber._id);
                    const optionClasses = [
                      "reserve-room-card__option",
                      checked ? "reserve-room-card__option--selected" : "",
                      disabled ? "reserve-room-card__option--disabled" : "",
                    ]
                      .filter(Boolean)
                      .join(" ");
                    return (
                      <label
                        className={optionClasses}
                        key={roomNumber._id}
                      >
                        <input
                          type="checkbox"
                          value={roomNumber._id}
                          onChange={(event) => handleSelect(event, item, roomNumber)}
                          disabled={disabled}
                          checked={checked}
                        />
                        <span className="reserve-room-card__label">Suite {roomNumber.number}</span>
                        {!disabled ? (
                          <span className="reserve-room-card__availability">Available</span>
                        ) : (
                          <span className="reserve-room-card__availability reserve-room-card__availability--full">
                            Unavailable
                          </span>
                        )}
                      </label>
                    );
                  })}
                </div>
              </article>
            ))
          )}
        </div>
        {updateError && <div className="reserve-modal__banner reserve-modal__banner--error">{updateError}</div>}
        {successMessage && <div className="reserve-modal__banner reserve-modal__banner--success">{successMessage}</div>}
        <footer className="reserve-modal__footer">
          <div className="reserve-modal__summary">
            <span>{selectedCount} room{selectedCount !== 1 ? "s" : ""} selected</span>
            <strong>{formatCurrency(totalSelected)}</strong>
          </div>
          <button
            type="button"
            onClick={handleClick}
            className="reserve-modal__button"
            disabled={updating || !selectedRooms.length}
          >
            {updating ? "Processing…" : "Reserve now"}
          </button>
        </footer>
      </div>
    </div>
  );
};

export default Reserve;

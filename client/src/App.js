import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";
import Home from "./pages/home/Home";
import List from "./pages/list/List";
import Hotel from "./pages/hotel/Hotel";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import Bookings from "./pages/bookings/Bookings";
import Transactions from "./pages/transactions/Transactions";
import Checkout from "./pages/checkout/Checkout";
import TransactionReceipt from "./pages/transactions/TransactionReceipt";
import Experiences from "./pages/experiences/Experiences";
import Stories from "./pages/stories/Stories";
import CreateRoom from "./pages/admin/CreateRoom";
import TodaysBookings from "./pages/admin/TodaysBookings";
import TodaysTransactions from "./pages/admin/TodaysTransactions";
import ManageHotel from "./pages/admin/ManageHotel";
import ManageRooms from "./pages/admin/ManageRooms";
import ComingSoonAirports from "./pages/comingSoon/ComingSoonAirports";
import ComingSoonTaxis from "./pages/comingSoon/ComingSoonTaxis";
import ComingSoonCarRentals from "./pages/comingSoon/ComingSoonCarRentals";
import ComingSoonFlights from "./pages/comingSoon/ComingSoonFlights";
import ComingSoonAttractions from "./pages/comingSoon/ComingSoonAttractions";
import ScrollToTop from "./components/ScrollToTop";

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path="/hotels" element={<List/>}/>
        <Route path="/hotels/:id" element={<Hotel/>}/>
        <Route path="/login" element={<Login/>}/>
        <Route path="/register" element={<Register/>}/>
        <Route path="/bookings" element={<Bookings/>}/>
        <Route path="/checkout/:bookingId" element={<Checkout/>}/>
        <Route path="/transactions" element={<Transactions/>}/>
        <Route path="/transactions/:transactionId" element={<TransactionReceipt/>}/>
        <Route path="/experiences" element={<Experiences/>}/>
        <Route path="/stories" element={<Stories/>}/>
        <Route path="/airports" element={<ComingSoonAirports/>}/>
        <Route path="/taxis" element={<ComingSoonTaxis/>}/>
        <Route path="/car-rentals" element={<ComingSoonCarRentals/>}/>
        <Route path="/flights" element={<ComingSoonFlights/>}/>
        <Route path="/attractions" element={<ComingSoonAttractions/>}/>
        <Route path="/admin/new-room" element={<CreateRoom/>}/>
        <Route path="/admin/today-bookings" element={<TodaysBookings/>}/>
        <Route path="/admin/today-transactions" element={<TodaysTransactions/>}/>
        <Route path="/admin/manage-hotel" element={<ManageHotel/>}/>
        <Route path="/admin/manage-rooms" element={<ManageRooms/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

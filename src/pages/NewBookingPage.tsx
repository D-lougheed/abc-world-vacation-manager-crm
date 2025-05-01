
import BookingForm from "@/components/forms/BookingForm";

const NewBookingPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">New Booking</h1>
      </div>
      
      <div className="mt-6">
        <BookingForm />
      </div>
    </div>
  );
};

export default NewBookingPage;

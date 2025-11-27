import React, { useState, useEffect } from 'react';
import { roomAPI } from '../../services/api';

const RoomAllocationContent = () => {
  const [unallocatedStudents, setUnallocatedStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [unallocatedRes, roomsRes, allocationsRes] = await Promise.allSettled([
        roomAPI.getUnallocatedStudents(),
        roomAPI.getAll(),
        roomAPI.viewAllotments()
      ]);

      if (unallocatedRes.status === 'fulfilled') {
        setUnallocatedStudents(unallocatedRes.value);
      }

      if (roomsRes.status === 'fulfilled') {
        setRooms(roomsRes.value);
      }

      if (allocationsRes.status === 'fulfilled') {
        setAllocations(allocationsRes.value);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const allocateRoom = async () => {
    if (!selectedStudent || !selectedRoom) {
      setError('Please select both student and room');
      return;
    }

    const selectedRoomNo = Number(selectedRoom);
    const selectedRoomData = rooms.find((r) => r.roomNo === selectedRoomNo);
    if (!selectedRoomData) {
      setError('Selected room not found');
      return;
    }

    if ((selectedRoomData.currentOccupancy || 0) >= (selectedRoomData.capacity || 0)) {
      setError('Room is full');
      return;
    }

    try {
      setError('');
      await roomAPI.allotRoom({
        studentPrn: selectedStudent,
        roomNo: selectedRoomData.roomNo
        // allotmentDate is optional; backend defaults to current date
      });

      setSuccess('Room allotted successfully');
      setSelectedStudent('');
      setSelectedRoom('');
      fetchData();
    } catch (error) {
      console.error('Error allocating room:', error);
      setError(error.message || 'Failed to allocate room');
    }
  };

  const activeAllocations = allocations.filter((alloc) => alloc.status === 'ACTIVE');

  // Group rooms by floor (based on first digit of room number)
  const roomsByFloor = rooms.reduce((acc, room) => {
    const floor = String(room.roomNo).charAt(0) || '0';
    if (!acc[floor]) acc[floor] = [];
    acc[floor].push(room);
    return acc;
  }, {});

  // Get students for each room from allocations
  const getStudentsForRoom = (roomNo) => {
    return activeAllocations
      .filter((alloc) => alloc.roomNo === roomNo)
      .map((alloc) => alloc.studentPrn);
  };

  const getRoomColor = (room) => {
    const occupancy = room.currentOccupancy || 0;

    if (occupancy <= 0) return 'full';      // 0 students -> red
    if (occupancy === 1) return 'semi-full'; // 1 student -> orange
    if (occupancy === 2) return 'low';       // 2 students -> yellow
    return 'empty';                          // 3 or more -> green
  };

  const allocationsByRoom = activeAllocations.reduce((acc, alloc) => {
    const roomNo = alloc.roomNo;
    if (!acc[roomNo]) acc[roomNo] = [];
    acc[roomNo].push(alloc);
    return acc;
  }, {});

  if (loading) {
    return <div className="loading">Loading room allocation data...</div>;
  }

  return (
    <div className="roomAllocationContainer">
      <h2>Room Allocation</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      {/* Unallocated Students */}
      <div className="pendingRequests">
        <h3>Unallocated Students ({unallocatedStudents.length})</h3>
        {unallocatedStudents.length === 0 && <p>No unallocated students</p>}
        {unallocatedStudents.map((student, i) => (
          <div
            key={student.prn}
            className={`pendingItem ${
              selectedStudent === student.prn ? "selected" : ""
            }`}
            onClick={() => setSelectedStudent(student.prn)}
          >
            {student.firstName} {student.lastName} (PRN: {student.prn})
          </div>
        ))}
      </div>

      {/* Allocation Panel */}
      <div className="allocationPanel">
        <select
          value={selectedRoom}
          onChange={(e) => setSelectedRoom(e.target.value)}
        >
          <option value="">Select Room</option>
          {rooms
            .slice()
            .sort((a, b) => (a.roomNo || 0) - (b.roomNo || 0))
            .filter((r) => (r.currentOccupancy || 0) < (r.capacity || 3))
            .map((r) => (
              <option key={r.roomNo} value={r.roomNo}>
                {r.roomNo} ({r.currentOccupancy || 0}/{r.capacity || 3})
              </option>
            ))}
        </select>
        <button onClick={allocateRoom} disabled={!selectedStudent || !selectedRoom}>
          Allocate Room
        </button>
      </div>

      {/* Room Grid */}
      <div className="roomGridContainer">
        {Object.keys(roomsByFloor).sort().map((floor) => (
          <div key={floor} className="floorSection">
            <h3>Floor {floor}</h3>
            <div className="roomGrid">
              {roomsByFloor[floor]
                .slice()
                .sort((a, b) => (a.roomNo || 0) - (b.roomNo || 0))
                .map((room) => {
                const colorClass = getRoomColor(room);
                const isSelected = Number(selectedRoom) === room.roomNo;
                const isFull = (room.currentOccupancy || 0) >= (room.capacity || 3);
                return (
                  <div
                    key={room.roomNo}
                    className={`roomBox ${colorClass} ${isSelected ? 'selected' : ''} ${isFull ? 'disabled' : ''}`}
                    title={`Room ${room.roomNo} - ${room.currentOccupancy || 0}/${room.capacity || 3}`}
                    onClick={() => {
                      if (isFull) return; // don't allow selecting full rooms
                      setSelectedRoom(String(room.roomNo));
                    }}
                  >
                    {room.roomNo}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Room-wise Allocations */}
      <div className="roomAllocationsSection">
        <h3>Room-wise Allocations</h3>
        {Object.keys(roomsByFloor).sort().map((floor) => (
          <div key={`alloc-floor-${floor}`} className="roomAllocationsFloor">
            <h4>Floor {floor}</h4>
            <div className="roomAllocationsGrid">
              {roomsByFloor[floor]
                .slice()
                .sort((a, b) => (a.roomNo || 0) - (b.roomNo || 0))
                .map((room) => {
                const roomAllocations = allocationsByRoom[room.roomNo] || [];
                return (
                  <div key={`room-card-${room.roomNo}`} className="roomAllocationsCard">
                    <div className="roomAllocationsCardHeader">
                      <span>Room {room.roomNo}</span>
                      <span>{roomAllocations.length}/{room.capacity || 3}</span>
                    </div>
                    {roomAllocations.length === 0 ? (
                      <p className="roomAllocationsEmpty">No students allocated</p>
                    ) : (
                      <div className="roomAllocationsStudents">
                        {roomAllocations.map((alloc) => (
                          <div key={`${room.roomNo}-${alloc.studentPrn}`} className="roomAllocationsStudent">
                            <div className="roomAllocationsStudentInfo">
                              <span className="roomAllocationsStudentPrn">
                                {[alloc.studentFirstName, alloc.studentLastName]
                                  .filter(Boolean)
                                  .join(' ') || alloc.studentPrn}
                              </span>
                              <span className="roomAllocationsStudentDate">(PRN: {alloc.studentPrn})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoomAllocationContent;

import { useState } from 'react';
const defaultEvents = [{
  id: '1',
  title: 'Design Review',
  start: new Date(),
  end: new Date(),
  className: 'bg-primary-subtle text-primary'
}, {
  id: '2',
  title: 'Marketing Strategy',
  start: new Date(Date.now() + 16000000),
  end: new Date(Date.now() + 20000000),
  className: 'bg-secondary-subtle text-secondary'
}, {
  id: '3',
  title: 'Sales Demo',
  start: new Date(Date.now() + 40000000),
  end: new Date(Date.now() + 80000000),
  className: 'bg-success-subtle text-success'
}, {
  id: '4',
  title: 'Deadline Submission',
  start: new Date(Date.now() + 120000000),
  end: new Date(Date.now() + 180000000),
  className: 'bg-danger-subtle text-danger'
}, {
  id: '5',
  title: 'Training Session',
  start: new Date(Date.now() + 250000000),
  end: new Date(Date.now() + 290000000),
  className: 'bg-info-subtle text-info'
}, {
  id: '6',
  title: 'Budget Review',
  start: new Date(Date.now() + 400000000),
  end: new Date(Date.now() + 450000000),
  className: 'bg-warning-subtle text-warning'
}, {
  id: '7',
  title: 'Board Meeting',
  start: new Date(Date.now() + 600000000),
  end: new Date(Date.now() + 620000000),
  className: 'bg-dark-subtle text-dark'
}];
const useCalendar = () => {
  const [show, setShow] = useState(false);
  const onOpenModal = () => setShow(true);
  const [isEditable, setIsEditable] = useState(false);
  const [events, setEvents] = useState([...defaultEvents]);
  const [eventData, setEventData] = useState();
  const [dateInfo, setDateInfo] = useState();
  const onCloseModal = () => {
    setEventData(undefined);
    setDateInfo(undefined);
    setShow(false);
  };
  const onDateClick = arg => {
    setDateInfo(arg);
    onOpenModal();
    setIsEditable(false);
  };
  const onEventClick = arg => {
    const classNames = arg.event.classNames;
    const event = {
      id: arg.event.id,
      title: arg.event.title,
      className: Array.isArray(classNames) ? classNames.join(' ') : classNames || ''
    };
    setEventData(event);
    setIsEditable(true);
    onOpenModal();
  };
  const onDrop = arg => {
    const dropEventData = arg;
    const title = dropEventData.draggedEl.title;
    if (title) {
      const newEvent = {
        id: dropEventData.draggedEl.id,
        title,
        start: dropEventData ? dropEventData.dateStr : new Date(),
        className: dropEventData.draggedEl.dataset.class
      };
      const modifiedEvents = [...events];
      modifiedEvents.push(newEvent);
      setEvents(modifiedEvents);
    }
  };
  const onAddEvent = data => {
    const modifiedEvents = [...events];
    const event = {
      id: String(modifiedEvents.length + 1),
      title: data.title,
      start: Object.keys(dateInfo ?? {}).length !== 0 ? dateInfo?.date : new Date(),
      className: data.category
    };
    modifiedEvents.push(event);
    setEvents(modifiedEvents);
    onCloseModal();
  };
  const onUpdateEvent = data => {
    setEvents(events.map(e => {
      if (e.id === eventData?.id) {
        return {
          ...e,
          title: data.title,
          className: data.category
        };
      } else {
        return e;
      }
    }));
    onCloseModal();
    setIsEditable(false);
  };
  const onRemoveEvent = () => {
    const modifiedEvents = [...events];
    const idx = modifiedEvents.findIndex(e => e.id === eventData?.id);
    modifiedEvents.splice(idx, 1);
    setEvents(modifiedEvents);
    onCloseModal();
  };
  const onEventDrop = arg => {
    const modifiedEvents = [...events];
    const idx = modifiedEvents.findIndex(e => e.id === arg.event.id);
    modifiedEvents[idx].title = arg.event.title;
    modifiedEvents[idx].className = arg.event.classNames;
    modifiedEvents[idx].start = arg.event.start;
    modifiedEvents[idx].end = arg.event.end;
    setEvents(modifiedEvents);
    setIsEditable(false);
  };
  const createNewEvent = () => {
    setIsEditable(false);
    onOpenModal();
  };
  return {
    createNewEvent,
    show,
    onDateClick,
    onEventClick,
    onDrop,
    onEventDrop,
    events,
    onCloseModal,
    isEditable,
    eventData,
    onUpdateEvent,
    onRemoveEvent,
    onAddEvent
  };
};
export default useCalendar;
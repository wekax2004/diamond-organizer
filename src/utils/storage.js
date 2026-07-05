import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "./firebase";

export const getTasks = async () => {
  const querySnapshot = await getDocs(collection(db, "tasks"));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

export const subscribeToTasks = (callback) => {
  return onSnapshot(collection(db, "tasks"), (snapshot) => {
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    callback(tasks);
  });
};

export const addTask = async (task) => {
  const newTask = {
    ...task,
    createdAt: new Date().toISOString(),
    status: 'active'
  };
  const docRef = await addDoc(collection(db, "tasks"), newTask);
  return { id: docRef.id, ...newTask };
};

export const updateTask = async (updatedTask) => {
  const { id, ...data } = updatedTask;
  await updateDoc(doc(db, "tasks", id), data);
};

export const deleteTask = async (taskId) => {
  await deleteDoc(doc(db, "tasks", taskId));
};

// Convert File object to Base64 string and compress it for storage
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Compress as JPEG with 0.7 quality to stay well under 1MB Firestore limit
        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        resolve(dataUrl);
      };
      img.onerror = reject;
      img.src = event.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

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
    completed: false
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

// Convert File object to Base64 string for storage
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
};

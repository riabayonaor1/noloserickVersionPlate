import { auth, db } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

// Lista de emails de administradores
const ADMIN_EMAILS = ['rickynovich32@gmail.com', 'riabayonaor@unal.edu.co'];

// Si necesitas añadir más administradores, agrégalos a la lista anterior

const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    
    // Guardar el usuario en Firestore si no existe
    if (user) {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // Crear el documento del usuario
          await setDoc(userRef, {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            isAdmin: ADMIN_EMAILS.includes(user.email || ''),
            createdAt: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.warn("No se pudo guardar el usuario en Firestore, pero el inicio de sesión es válido:", error);
      }
    }
    
    return user;
  } catch (error) {
    console.error("Error signing in with Google: ", error);
    return null;
  }
};

export const logout = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("Error signing out: ", error);
  }
};

export const onAuthUserChanged = (callback: (user: User | null, isAdmin: boolean) => void): (() => void) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Verificar si el email está en la lista de administradores
      // Usar esta verificación directa primero para evitar problemas de permisos
      const isAdminUser = ADMIN_EMAILS.includes(user.email || '');
      
      try {
        // Solo intentar verificar en Firestore si tenemos permiso
        if (isAdminUser) {
          // Verificar si el usuario existe en Firestore
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef);
          
          if (!userSnap.exists()) {
            // Si no existe en Firestore, crearlo
            await setDoc(userRef, {
              email: user.email,
              displayName: user.displayName,
              photoURL: user.photoURL,
              isAdmin: isAdminUser,
              createdAt: new Date().toISOString(),
            });
          }
        }
      } catch (error) {
        console.warn("Error al acceder a Firestore para verificar usuario, pero se usará la lista de administradores local:", error);
      }
      
      // Siempre llamar al callback con el usuario y el estatus de admin basado en la lista local
      callback(user, isAdminUser);
    } else {
      callback(null, false);
    }
  });
};

export const isAdminUser = async (user: User | null): Promise<boolean> => {
  if (!user || !user.email) return false;
  
  // Verificar si el email está en la lista de administradores
  return ADMIN_EMAILS.includes(user.email);
};

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Inicializa la conexión con los servicios de Firebase
admin.initializeApp();

// Esta es nuestra función de migración. Se activará cuando visitemos una URL.
export const migrateUsersToAuth = functions.https.onRequest(async (req, res)=> {
  // Obtenemos una referencia a la base de datos de Firestore.
  const db = admin.firestore();

  try {
    // 1. Leemos TODOS los documentos de tu colección "systemUsers".
    // Si tu colección se llama diferente, cambia "systemUsers" aquí.
    const usersSnapshot = await db.collection("systemUsers").get();

    if (usersSnapshot.empty) {
      res.status(200).send("No hay usuarios en Firestore para migrar.");
      return;
    }

    const migrationPromises: Promise<any>[] = [];
    let successCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // 2. Recorremos cada usuario encontrado en Firestore.
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();

      // EXTRAE LOS DATOS DEL USUARIO USANDO TUS NOMBRES DE CAMPO EXACTOS
      const email = userData.email;
      const firstName = userData.firstName || ""; // Usamos '' si no existe
      const lastName = userData.lastName || ""; // Usamos '' si no existe
      const displayName = `${firstName} ${lastName}`.trim(); // Nombre apellido

      if (!email) {
        console.error("Usuario sin email, saltando:", doc.id);
        errorCount++;
        errors.push(`Documento ${doc.id} no tiene email.`);
        return; // Pasa al siguiente
      }

      // 3. Creamos promesa para registrar usuario en Firebase Authentication.
      const promise = admin.auth().createUser({
        email: email,
        displayName: displayName,
        // Los usuarios se crearán sin contraseña.
        // Usar el flujo "Olvidé mi contraseña" para primer inicio de sesión.
      })
        .then((userRecord) => {
          console.log("Usuario creado exitosamente en Auth:", userRecord.email);
          successCount++;
        })
        .catch((error) => {
        // Esto pasará si el usuario ya existe en Authentication, está bien.
          console.error("Error creando usuario en Auth:", email, error.message);
          errorCount++;
          errors.push(`Error con ${email}: ${error.message}`);
        });

      migrationPromises.push(promise);
    });

    // 4. Esperamos a que todas las promesas de creación de usuarios terminen.
    await Promise.all(migrationPromises);

    // 5. Enviamos una respuesta al navegador con el resumen.
    res.status(200).send(
      `Migración completada. Usuarios exitosos: ${successCount}. ` +
      `Errores: ${errorCount}.<br/><br/>` +
      `Errores detallados:<br/>${errors.join("<br/>")}`
    );
  } catch (error) {
    console.error("Error general durante la migración:", error);
    if (error instanceof Error) {
      res.status(500).send(`Ocurrió un error general: ${error.message}`);
    } else {
      res.status(500).send("Ocurrió un error general desconocido.");
    }
  }
});

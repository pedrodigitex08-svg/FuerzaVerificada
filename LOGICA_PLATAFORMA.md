# Especificación Funcional y Lógica de Arquitectura: Plataforma FuerzaVerificada

Este documento detalla la lógica operativa paso a paso de extremo a extremo (Frontend en Next.js + Backend/Auth en Supabase) para cada vista, botón, formulario y tabla de la base de datos de **FuerzaVerificada**, dividida en los cuatro módulos estructurales del sistema.

---

## 1. LANDING PAGE, INICIAR SESIÓN, REGISTRO Y GUARDADO DE DATOS

### 1.1. Landing Page (Página Pública `/`) y Barra de Navegación (`Navbar`)

Esta vista está diseñada para captar tanto a personal operativo (vigilantes, escoltas, supervisores y operadores de medios tecnológicos) como a empresas de seguridad privada y departamentos de talento humano, sin exponer funciones internas ni herramientas de demostración.

* **Barra de Navegación Superior (`Navbar`) — Estado Sin Sesión:**
* **Botón único `Ingresar / Registrarse`:** Es el único elemento de acceso visible en la esquina superior derecha (sin textos redundantes de *"Iniciar Sesión"* al lado). Al hacer clic, redirige a la ruta `/login`.




* **Sección Principal (Hero) y Tarjeta Demostrativa:**
* Muestra la propuesta de valor corporativa y una tarjeta visual demostrativa de solo lectura (*Expediente / Credencial Verificada*) que ilustra cómo visualizan los directores de operaciones el perfil de un candidato: estado del curso SuperVigilancia, validación de antecedentes, certificaciones (Reentrenamiento, Indumil, Libreta Militar, Moto propia) y semáforo de confiabilidad (Estudio de Seguridad, Visita Domiciliaria y Poligrafía).




* **Listado Público de Vacantes y Botones de Intercepción:**
* **Lógica de carga:** Ejecuta un `SELECT` público sobre la tabla `public.job_posts` filtrando únicamente las ofertas activas. Si la tabla no tiene registros, muestra un estado vacío limpio (nunca datos falsos o *mock*).


* **Botón `Postularme` (cuando el visitante NO ha iniciado sesión):** Al hacer clic, el sistema detecta que `session === null`, intercepta la acción y redirige automáticamente a `/login` para obligar al usuario a autenticarse antes de procesar cualquier postulación.
* **Botón `Planes para Empresas` / `Publicar Vacante` (sin sesión):** Redirige a `/login` preseleccionando el modo de ingreso corporativo para empresas.



---

### 1.2. Flujo de Registro y Guardado de Datos en Base de Datos

El sistema permite el registro mediante **Correo y Contraseña** o mediante **Google OAuth**, sincronizando los datos entre el esquema de seguridad `auth.users` y el esquema público `public.profiles`.

#### A. Selección del Tipo de Cuenta en el Formulario

En la parte superior de la tarjeta de acceso (`/login`), el usuario elige su perfil mediante dos tarjetas interactivas (y un enlace inferior `¿No tienes una cuenta? Regístrate aquí`):

1. **Opción 1: `Personal operativo de seguridad**` (Vigilantes, Escoltas, Supervisores y Operadores) $\rightarrow$ Asigna internamente el valor `'candidate'`.


2. **Opción 2: `Empresa de Seguridad**` (Portal B2B, ATS y Verificación de Personal) $\rightarrow$ Asigna internamente el valor `'company'`.
*(Nota: El bloque inferior de "Acceso Rápido de Demostración" con botones Demo queda eliminado permanentemente en producción)*.



#### B. Registro con Correo y Contraseña (`signUp`)

1. **Captura de datos en el formulario:**
* Si eligió **Personal Operativo (`candidate`)**: Solicita Nombre Completo (`full_name`), Correo Electrónico (`email`), Teléfono WhatsApp (`phone_whatsapp`) y Contraseña (`password`).


* Si eligió **Empresa (`company`)**: Solicita Razón Social / Nombre de Empresa (`full_name`), NIT, Correo Corporativo (`email`), Teléfono de Contacto (`phone_whatsapp`) y Contraseña (`password`).




2. **Ejecución en Supabase Auth:**
* Al presionar el botón de registro, el frontend ejecuta `supabase.auth.signUp({ email, password, options: { data: { full_name, phone_whatsapp, role } } })`.
* Esto crea el usuario en la tabla interna `auth.users` con proveedor `Email`.




3. **Disparador Automático en Base de Datos (Trigger `on_auth_user_created`):**
* En el mismo milisegundo en que se inserta el registro en `auth.users`, la función SQL `public.handle_new_user()` se dispara automáticamente.


* Inserta una nueva fila en `public.profiles` copiando el `id` (UUID), `email`, `full_name`, `phone_whatsapp` y el `role` (`'candidate'` o `'company'`).




4. **Creación de tabla extendida según el rol:**
* Si `role === 'candidate'`, el sistema asegura la creación de su ficha base en `public.candidate_profiles` vinculada al mismo UUID.


* Si `role === 'company'`, el sistema inserta su ficha corporativa inicial en `public.companies` con estado pendiente de verificación administrativa.





#### C. Registro / Ingreso con Google (`Continuar con Google`)

1. **Acción del botón:** Al hacer clic en el botón **`Continuar con Google`**, se ejecuta `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '${window.location.origin}/auth/callback' } })`.


2. **Recepción en `/auth/callback` y guardado:**
* Google devuelve el nombre y el correo electrónico a `auth.users` bajo el proveedor `Google` (`Social`).


* Como Google no entrega número de WhatsApp, la columna `phone_whatsapp` en `public.profiles` permite valores nulos o vacíos (`EMPTY`) para que el Trigger `handle_new_user()` cree la fila en `public.profiles` sin arrojar error de restricción `not-null`.


* Como respaldo adicional, al aterrizar del callback, la aplicación ejecuta un `upsert` sobre `public.profiles` garantizando que el perfil exista antes de redirigir al usuario a su panel.



---

### 1.3. Flujo de Inicio de Sesión (`/login`) y Redirección por Rol

1. **Ingreso de credenciales:** El usuario introduce su correo electrónico y contraseña y presiona el botón negro de envío (**`Ingresar a la Plataforma ->`** o **`Ingresar al Panel Corporativo ->`**).


2. **Validación de Autenticación:**
* El sistema limpia espacios en blanco del correo (`email.trim().toLowerCase()`) y ejecuta `supabase.auth.signInWithPassword({ email, password })`.
* **Si las credenciales fallan:** Apaga el estado de carga y muestra la alerta roja: *"No te encuentras registrado o tus datos son incorrectos. Si no tienes cuenta, debes registrarte primero aquí."*.


* **Si falta confirmar correo:** Si el error devuelto por Supabase es `"Email not confirmed"`, solicita revisar la bandeja de entrada (o pasa directo si la confirmación por correo está desactivada en el panel de Supabase).


3. **Consulta de la Fuente Única de Verdad (`public.profiles`) y Auto-Redirección:**
* Una vez autenticado en `auth.users`, el sistema **no** confía ciegamente en cuál de las dos tarjetas visuales tenía marcada el usuario en la pantalla de login, sino que ejecuta:
`SELECT role FROM public.profiles WHERE id = auth.uid()`.


* Con base en el valor exacto del enum `user_role` (`{candidate,company,admin}`), redirige automáticamente:


* Si `role === 'candidate'` $\rightarrow$ Redirige al Panel Operativo de Candidato y carga el Navbar exclusivo de personas.
* Si `role === 'company'` $\rightarrow$ Redirige al Panel Corporativo de Empresa y carga el Navbar exclusivo de empresas.
* Si `role === 'admin'` $\rightarrow$ Redirige al Panel de Control de SuperAdministrador (`/admin`).





---

### 1.4. Recuperación de Contraseña y Cierre de Sesión

* **Enlace `¿Olvidaste tu contraseña?`:**
* Ubicado justo encima de la caja de texto de contraseña en `/login`.


* **Paso 1:** Al hacer clic, despliega el campo para ingresar el correo electrónico registrado y el botón *"Enviar enlace de recuperación"*.
* **Paso 2:** Ejecuta `supabase.auth.resetPasswordForEmail(email, { redirectTo: '${window.location.origin}/actualizar-password' })` y muestra aviso de confirmación en pantalla.
* **Paso 3:** Cuando el usuario abre el enlace desde su correo, aterriza en `/actualizar-password`, ingresa su nueva clave dos veces y el botón ejecuta `supabase.auth.updateUser({ password: nuevaPassword })`, guardando el nuevo hash encriptado en `auth.users` y redirigiendo a su panel.


* **Botón `Cerrar Sesión` (`Logout`):**
* Ejecuta `await supabase.auth.signOut()`, limpia por completo el estado local de usuario/rol en memoria, reinicia los estados de carga (`loading = false`) para evitar que un reingreso con Google se quede congelado en *"Ingresando..."*, y fuerza la redirección limpia a `/login`.



---

## 2. FUNCIONES Y LÓGICA DEL ROL `candidate` (PERSONAL OPERATIVO)

El rol **`candidate`** está diseñado única y exclusivamente para guardas de seguridad, escoltas, supervisores y operadores de medios tecnológicos que buscan empleo y desean certificar su hoja de vida operativa.

### 2.1. Reglas de Aislamiento Visual y de Rutas para `candidate`

| Qué VE en su Barra de Navegación y Panel | Qué tiene ESTRICTAMENTE PROHIBIDO ver o abrir |
| --- | --- |
| • **Vacantes / Buscar Empleo**<br>

<br>• **Mi Hoja de Vida / Mi Perfil Operativo**<br>

<br>• **Mis Cursos y Documentos**<br>

<br>• **Mis Postulaciones**<br>

<br>• **Academias Aliadas** | • Botón *"Publicar Vacante"*<br>

<br>• *"Solicitar Polígrafo / Visita Domiciliaria"*<br>

<br>• *"Directorio de Personal para Empresas"*<br>

<br>• *"Planes B2B / Planes Corporativos"*<br>

<br>• *"Panel de Empresa"* o *"Panel SuperAdmin"* |

*(Si un usuario con rol `candidate` escribe manualmente en el navegador la URL de empresa o `/admin`, el guardia de rutas lo intercepta y lo devuelve a su panel de candidato).*

### 2.2. Lógica Detallada de cada Función y Botón del Candidato

#### A. Gestión de "Mi Hoja de Vida / Mi Perfil Operativo" (`public.candidate_profiles`)

* **Propósito:** Construir el expediente táctico y operativo que verán las empresas de seguridad.


* **Lógica al abrir la vista:** Hace un `SELECT * FROM public.profiles` y `SELECT * FROM public.candidate_profiles WHERE id = auth.uid()`.


* **Campos que edita el candidato:**
* Datos de contacto: Nombre completo, WhatsApp (`phone_whatsapp`), ciudad/ubicación (ej. Bogotá D.C., Santa Marta, etc.).


* Perfil profesional: Cargo o especialidad (Vigilante Fijo, Escolta VIP, Supervisor, Operador de Medios), años de experiencia, clase de Libreta Militar, tenencia de vehículo/moto propia y cilindraje, y resumen laboral.




* **Botón `Guardar Cambios en mi Perfil`:**
* Ejecuta un `UPDATE` en `public.profiles` (para `full_name` y `phone_whatsapp`) y un `UPSERT` en `public.candidate_profiles`.


* Muestra notificación de éxito y actualiza en tiempo real la vista previa de su **Credencial Verificada**.





#### B. Registro de "Mis Cursos y Credenciales" (`public.candidate_courses`)

* **Propósito:** Registrar los cursos de ley exigidos por la SuperVigilancia (Fundamentación, Reentrenamiento Vigilancia, Manejo de Armas Cortas Indumil, etc.).


* **Botón `+ Agregar Curso / Certificación`:**
* Abre un formulario donde el candidato ingresa: Nombre del curso, Academia donde lo realizó, Número de registro/NRO SuperVigilancia y Fecha de vencimiento o realización.
* Al guardar, ejecuta `INSERT INTO public.candidate_courses` vinculado al `candidate_id`.


* **Cálculo automático de vigencia:** El sistema calcula los días restantes de vigencia del curso y muestra la etiqueta correspondiente en su perfil (ej. *"Curso Vigente - X días restantes"*).




* **Botón `Eliminar` (en un curso registrado):** Ejecuta `DELETE FROM public.candidate_courses WHERE id = course_id AND candidate_id = auth.uid()`.

#### C. Carga de "Mis Documentos y Soportes" (`public.candidate_documents`)

* **Propósito:** Respaldar con archivos reales (PDF o imágenes) los certificados del candidato (Hoja de Vida en PDF, Diploma SuperVigilancia, Libreta Militar, Cédula, Antecedentes).


* **Botón `Subir Documento / Adjuntar Soporte`:**
1. Sube el archivo al Bucket de almacenamiento de Supabase Storage (o guarda la referencia del documento).
2. Inserta el registro en la tabla `public.candidate_documents` con el tipo de documento, la URL del archivo y el estado inicial de validación (`pendiente` hasta que el SuperAdmin lo revise).




* **Botón `Ver / Descargar Hoja de Vida PDF`:** Permite al candidato previsualizar cómo luce su expediente o abrir el PDF cargado.



#### D. Buscador de Empleo y Botón `Postularme` (`public.job_posts` $\rightarrow$ `public.applications`)

* **Propósito:** Permitir al personal operativo encontrar ofertas reales publicadas por empresas de seguridad y postularse en un clic.
* **Filtros de búsqueda:** Filtra la consulta `SELECT * FROM public.job_posts` por ciudad, tipo de cargo (Vigilante, Escolta, Supervisor, Operador) o rango salarial.


* **Lógica del Botón `Postularme` dentro de una Vacante:**
1. Al cargar la tarjeta de la vacante, el sistema verifica en `public.applications` si ya existe un registro con `job_post_id = vacante.id` y `candidate_id = auth.uid()`.


2. **Si ya se postuló previamente:** El botón aparece deshabilitado en color gris o verde suave con el texto **`Ya estás postulado`** (impidiendo postulaciones duplicadas).
3. **Si NO se ha postulado:** Al hacer clic en **`Postularme`**, ejecuta `INSERT INTO public.applications (job_post_id, candidate_id, status, created_at)` con estado inicial `'postulado'` / `'en_revision'`. Cambia el botón inmediatamente a **`Postulación Enviada`**.





#### E. Sección "Mis Postulaciones" (`public.applications`)

* **Lógica:** Ejecuta un `SELECT` sobre `public.applications` haciendo `JOIN` con `public.job_posts` y `public.companies` donde `candidate_id = auth.uid()`.


* **Lo que muestra:** Lista todas las vacantes a las que el candidato ha aplicado, el nombre de la empresa de seguridad, la fecha de postulación y el estado actual actualizado por la empresa (*En revisión*, *Preseleccionado / En pruebas*, *Contratado* o *Finalizado*).

#### F. Directorio de "Academias Aliadas" (`public.partner_academies`)

* **Lógica:** Ejecuta `SELECT * FROM public.partner_academies` para mostrar al candidato las escuelas de capacitación en seguridad privada autorizadas donde puede renovar su curso vencido, con un botón de contacto directo por WhatsApp.



---

## 3. FUNCIONES Y LÓGICA DEL ROL `company` (EMPRESAS DE SEGURIDAD)

El rol **`company`** está diseñado exclusivamente para empresas de vigilancia y seguridad privada y departamentos de selección/talento humano que necesitan publicar ofertas, gestionar aspirantes (ATS) y solicitar estudios de confiabilidad (poligrafía, visitas domiciliarias y estudios de seguridad).

### 3.1. Reglas de Aislamiento Visual y de Rutas para `company`

| Qué VE en su Barra de Navegación y Panel Corporativo | Qué tiene ESTRICTAMENTE PROHIBIDO ver o abrir |
| --- | --- |
| • **Panel Corporativo / Mi Empresa**<br>

<br>• **Publicar Vacante**<br>

<br>• **Mis Vacantes y Postulantes (ATS)**<br>

<br>• **Directorio de Personal Verificado**<br>

<br>• **Solicitar Estudios de Seguridad (Polígrafo / Visita)**<br>

<br>• **Planes Corporativos B2B** | • *"Ver mi Hoja de Vida"* / *"Mi Perfil Operativo"*<br>

<br>• *"Mis Cursos"* o *"Subir mis Documentos"*<br>

<br>• *"Mis Postulaciones"* (como candidato)<br>

<br>• Botón *"Postularme"* en las ofertas de empleo<br>

<br>• *"Panel SuperAdmin (/admin)"* |

### 3.2. Lógica Detallada de cada Función y Botón de la Empresa

#### A. Panel Corporativo y Datos de "Mi Empresa" (`public.companies`)

* **Lógica al entrar:** Consulta `SELECT * FROM public.companies WHERE profile_id = auth.uid()` (o `id = auth.uid()`). Si la empresa fue promovida de rol o recién entró y aún no tiene fila en `public.companies`, el sistema le permite completarla y guardarla mediante un `UPSERT`.


* **Datos que gestiona:** Razón Social (ej. *Pedro Povea Ltda*), NIT, Ciudad sede, Nombre del contacto de Talento Humano, Teléfono corporativo y Licencia SuperVigilancia.


* **Indicador de Estado de Verificación:** Muestra si la cuenta corporativa está **Verificada / Activa** o **Pendiente de validación por el SuperAdministrador**.

#### B. Función "Publicar Nueva Vacante" (`public.job_posts`)

* **Botón `+ Publicar Vacante`:** Abre el formulario corporativo de creación de oferta laboral.
* **Campos del formulario:**
* Título del cargo (ej. *Guarda de Seguridad Motorizado*, *Escolta VIP Bilingüe*, *Operador de Medios Tecnológicos*).
* Ciudad / Ubicación del puesto, Salario ofrecido, Tipo de turno (2x2x2, 4x2, Fijo diurno, etc.).
* Requisitos obligatorios (ej. Curso vigente, Libreta de 1ra, Moto propia, Polígrafo previo) y descripción detallada de funciones.


* **Botón `Publicar Oferta Ahora`:**
* Ejecuta `INSERT INTO public.job_posts` asociando el `company_id` de la empresa autenticada y marcando la oferta como activa.


* La oferta aparece instantáneamente en el portal público y en el buscador de todos los usuarios con rol `candidate`.



#### C. Gestión de "Mis Vacantes y Candidatos Postulados (ATS)" (`job_posts` + `applications`)

* **Propósito:** Que el analista de selección vea quiénes se postularon a cada una de sus vacantes y gestione el proceso de contratación.
* **Lógica de visualización:**
1. Lista únicamente las vacantes en `public.job_posts` creadas por esa empresa (`WHERE company_id = mi_empresa.id`).


2. Muestra el contador de candidatos inscritos en cada vacante.


* **Botón `Ver Candidatos Postulados` (en cada vacante):**
* Ejecuta un `SELECT` en `public.applications` unido con `public.profiles`, `public.candidate_profiles`, `public.candidate_courses` y `public.candidate_documents` para listar los aspirantes de esa oferta.




* **Botones de acción sobre cada candidato postulado:**
* **Botón `Ver Expediente / Hoja de Vida PDF`:** Abre la tarjeta completa de **Credencial Verificada** de ese candidato específico (cursos, certificaciones, estado de poligrafía/visita domiciliaria y descarga de su CV en PDF). *(Nota clave: Aquí la empresa ve la Hoja de Vida del candidato postulado, nunca una hoja de vida propia).*


* **Selector / Botón `Cambiar Estado de Proceso`:** Permite a la empresa cambiar el estado de la postulación en `public.applications` (*En revisión* $\rightarrow$ *Citado a entrevista/pruebas* $\rightarrow$ *Contratado* o *Descartado*).
* **Botón `Contactar por WhatsApp`:** Toma el `phone_whatsapp` del candidato y abre `[https://wa.me/57](https://wa.me/57)...` con un mensaje corporativo prellenado informándole sobre la vacante.




* **Botón `Cerrar / Pausar Vacante`:** Ejecuta un `UPDATE` en `public.job_posts` cambiando el estado de la oferta a cerrada para que no reciba más postulaciones.

#### D. "Directorio de Personal Verificado" (`public.v_candidates_with_c...`)

* **Propósito:** Permitir a las empresas buscar proactivamente personal operativo en la base de datos aunque aún no se hayan postulado a una vacante.
* **Lógica:** Consulta la vista especializada `public.v_candidates_with_c...` (que consolida `profiles`, `candidate_profiles` y sus certificaciones).


* **Filtros:** Permite filtrar por ciudad, especialidad (Vigilante, Escolta, Supervisor, Operador), estado de curso vigente y si cuenta con Estudio de Seguridad / Poligrafía aprobada.


* **Botón `Ver Perfil Verificado`:** Despliega la ficha completa de confiabilidad del candidato.



#### E. Función "Solicitar Estudios de Seguridad" (`public.security_study_orders`)

* **Propósito:** Permitir a la empresa ordenar pruebas de confiabilidad para un candidato (antes de contratarlo) o para su propio personal:
1. **Examen de Poligrafía** (Pre-empleo o Rutina).


2. **Visita Domiciliaria Presencial**.


3. **Estudio de Seguridad Integral y Validación de Antecedentes**.




* **Botón `Solicitar Estudio / Polígrafo`:**
* Abre un formulario donde la empresa selecciona el tipo de estudio requerido, los datos o el ID del candidato a evaluar, la ciudad donde se realizará la prueba y observaciones.
* **Al confirmar la solicitud:**
1. Ejecuta un `INSERT INTO public.security_study_orders` vinculando el `company_id`, el `candidate_id` (o datos del evaluado), el tipo de servicio y el estado inicial `'solicitado'` / `'pendiente'`.


2. Opcionalmente abre la pasarela o el enlace directo al WhatsApp de operaciones de FuerzaVerificada con el número de orden generado para coordinar la agenda y facturación.




* **Sección `Mis Órdenes de Estudio`:** Lista todas las solicitudes creadas por la empresa en `public.security_study_orders` mostrando en qué etapa van (*Solicitado*, *Agendado*, *En Proceso*, *Completado - Aprobado / Sin Novedad*) y permitiendo descargar el informe final cuando el SuperAdmin lo publique.



---

## 4. FUNCIONES Y LÓGICA DEL ROL `admin` (SUPERADMINISTRADOR)

El rol **`admin`** es el centro de gobierno de **FuerzaVerificada**. Tiene control total sobre las validaciones de confiabilidad, las empresas registradas, las órdenes de poligrafía/visitas domiciliarias y los parámetros comerciales del sistema.

### 4.1. Reglas de Seguridad y Acceso del Rol `admin`

* **Asignación exclusiva por Base de Datos:** Ningún formulario público permite registrarse como `admin`. Este rol solo se otorga actualizando la columna `role = 'admin'` en `public.profiles` desde Supabase.


* **Protección de la ruta `/admin`:** Al entrar a cualquier ruta bajo `/admin`, el sistema verifica `profile.role === 'admin'`. Si es `'candidate'` o `'company'`, bloquea la vista inmediatamente y redirige al inicio.
* **Navbar del SuperAdmin:** Muestra de forma destacada el botón **`Panel SuperAdmin (/admin)`** además de permitirle auditar la plataforma.

### 4.2. Lógica Detallada de cada Función y Botón del SuperAdministrador

#### A. Módulo de Aprobación y Verificación de Empresas (`public.companies`)

* **Lógica de carga:** Ejecuta `SELECT * FROM public.companies` unido con `public.profiles`, mostrando primero las empresas recién registradas que están pendientes de revisión.


* **Información que audita el Admin:** Razón Social, NIT, correo corporativo, teléfono y licencia.
* **Botón `Aprobar / Verificar Empresa`:**
* Ejecuta `UPDATE public.companies SET is_verified = true (o status = 'verified') WHERE id = company_id`.
* A partir de ese instante, la empresa recibe el sello de empresa verificada y tiene habilitadas todas las funciones de publicación y consulta de expedientes completos.


* **Botón `Suspender / Rechazar Empresa`:** Cambia el estado de la empresa a suspendido/rechazado e inactiva sus ofertas visibles.

#### B. Módulo de Gestión de Órdenes de Estudios de Seguridad (`public.security_study_orders`)

* **Propósito:** Administrar las solicitudes de Polígrafo, Visita Domiciliaria y Estudio de Seguridad enviadas por las empresas.


* **Lógica de carga:** Ejecuta `SELECT * FROM public.security_study_orders ORDER BY created_at DESC`, mostrando qué empresa pidió el estudio, para qué candidato, qué tipo de prueba es y en qué fecha.


* **Botones de Gestión de Estado de la Orden:**
* **Botón `Marcar como Agendado / En Proceso`:** Actualiza el estado de la orden en `public.security_study_orders` para que la empresa vea en su panel que el candidato ya fue citado.


* **Botón `Finalizar y Emitir Resultado`:** Permite al SuperAdmin seleccionar el veredicto oficial del estudio (`Aprobado`, `Realizada`, `Sin Novedad` o `Con Novedad`) y adjuntar el enlace al reporte PDF.


* **Efecto automático en el Perfil del Candidato:** Al marcar un estudio como completado y aprobado, se actualizan los indicadores del semáforo de **"Verificación Integral de Confiabilidad"** (*Estudio Seg.: Aprobado*, *Visita Domicil.: Realizada*, *Poligrafía: Sin Novedad*) en la ficha del candidato (`public.candidate_profiles`).





#### C. Módulo de Certificación de Candidatos y Documentos (`candidate_profiles` + `candidate_documents`)

* **Propósito:** Otorgar el sello verde de **"PERFIL VERIFICADO • CURSO VIGENTE"** y **"Antecedentes OK"** que aparece en la Credencial Verificada del candidato.


* **Lógica:** El SuperAdmin revisa la lista de candidatos en `public.candidate_profiles`, sus cursos en `public.candidate_courses` y los documentos adjuntos en `public.candidate_documents`.


* **Botón `Validar Documento / Curso`:** Aprueba el certificado subido por el guarda tras comprobar su autenticidad ante SuperVigilancia / Indumil.


* **Botón `Otorgar Sello de Perfil Verificado`:** Actualiza el estado de verificación del candidato en `public.candidate_profiles`, activando el check verde junto a su nombre y posicionándolo en los primeros lugares del Directorio de Personal Verificado (`v_candidates_with_c...`).



#### D. Módulo de Gestión de Academias Aliadas (`public.partner_academies`)

* **Botón `+ Agregar Academia Aliada`:** Ejecuta `INSERT INTO public.partner_academies` con el nombre de la escuela de seguridad, ciudad, cursos que ofrece, descuento para usuarios de FuerzaVerificada y número de WhatsApp.


* **Botones `Editar` / `Activar-Inactivar`:** Ejecuta `UPDATE` o `DELETE` sobre `public.partner_academies`, actualizando de inmediato el directorio que ven los candidatos.



#### E. Configuración Comercial Global (Precios B2B y WhatsApp Oficial)

* **Propósito:** Permitirte ajustar las tarifas de los Planes B2B, el valor unitario de los polígrafos/visitas domiciliarias y el número de WhatsApp de atención corporativa sin tener que modificar el código fuente.
* **Botón `Guardar Configuración Global`:** Actualiza los parámetros globales del sistema para que todos los botones de contacto comercial y las tablas de precios de la plataforma reflejen los nuevos valores al instante.

---

## 5. RESUMEN DE FLUJO DE TABLAS EN SUPABASE (MAPA DE DATOS)

Para referencia rápida de auditoría en tu **Table Editor** de Supabase, así interactúa cada tabla con los roles:

| Nombre de la Tabla / Vista en Supabase

 | Quién Crea / Edita los Datos | Quién Lee los Datos |
| --- | --- | --- |
| **`public.profiles`**

 | Trigger automático al registrarse + el propio usuario (`candidate`, `company`, `admin`).

 | El propio usuario, Empresas (para ver datos básicos de postulantes) y `admin`. |
| **`public.candidate_profiles`**

 | El usuario con rol `candidate` (datos operativos) y el `admin` (sellos de verificación).

 | El propio `candidate`, usuarios `company` (en el directorio/ATS) y `admin`. |
| **`public.candidate_courses`**

 | El usuario `candidate` (agrega sus cursos) y el `admin` (valida vigencia).

 | El propio `candidate`, usuarios `company` y `admin`. |
| **`public.candidate_documents`**

 | El usuario `candidate` (sube PDFs/soportes) y el `admin` (aprueba soporte).

 | El propio `candidate`, usuarios `company` autorizados y `admin`. |
| **`public.companies`**

 | El usuario con rol `company` (datos de su empresa) y el `admin` (aprueba empresa). | La propia `company`, candidatos (ven el nombre de la empresa en la vacante) y `admin`. |
| **`public.job_posts`**

 | Exclusivamente usuarios con rol `company` (y moderación por `admin`). | Público general (visitantes), usuarios `candidate`, la `company` creadora y `admin`. |
| **`public.applications`**

 | El `candidate` (al hacer clic en *Postularme*) y la `company` (al cambiar el estado del proceso). | El `candidate` que se postuló, la `company` dueña de esa vacante y `admin`. |
| **`public.security_study_orders`**

 | Usuarios `company` (al solicitar Polígrafo, Visita o Estudio) y `admin` (al cargar resultados).

 | La `company` que solicitó la orden y el `admin`. |
| **`public.partner_academies`**

 | Exclusivamente el rol `admin`. | Todos los usuarios (especialmente `candidate` para renovar cursos). |
| **`public.v_candidates_with_c...`**

 | Vista automática generada por la base de datos (solo lectura). | Usuarios con rol `company` (Directorio B2B) y `admin`. |

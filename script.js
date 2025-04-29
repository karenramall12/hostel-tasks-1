document.addEventListener('DOMContentLoaded', function() {
    // Verifica se o Firebase já foi inicializado para evitar múltiplas inicializações
    if (!firebase.apps.length) {
        // Configuração do Firebase
        const firebaseConfig = {
            apiKey: "AIzaSyC5tZN0Qz5B_PqyGDLk4vwqdTARPQm9kj0",
            authDomain: "hostel-sp.firebaseapp.com",
            projectId: "hostel-sp",
            storageBucket: "hostel-sp.appspot.com",
            messagingSenderId: "1058972867746",
            appId: "1:1058972867746:web:1f8b4aaaae64ceed7a8bfb",
            measurementId: "G-5EXD9KED9P"
        };
        
        // Inicializa o Firebase
        firebase.initializeApp(firebaseConfig);
    }
    
    // Referência ao banco de dados
    const database = firebase.database();

    // Teste de conexão com o Firebase
    function testFirebaseConnection() {
        console.log("Testando conexão com o banco de dados...");
        
        database.ref('connectionTest').set({
            timestamp: firebase.database.ServerValue.TIMESTAMP,
            status: "Testando conexão"
        })
        .then(() => {
            console.log("✅ Conexão com o Firebase estabelecida com sucesso!");
            return database.ref('connectionTest').once('value');
        })
        .then((snapshot) => {
            console.log("Dados de teste confirmados:", snapshot.val());
            // Remove o nó de teste após verificação
            return database.ref('connectionTest').remove();
        })
        .catch(error => {
            console.error("❌ Erro na conexão com o Firebase:", error);
            alert("Erro ao conectar com o banco de dados: " + error.message);
        });
    }

    // Executa o teste de conexão
    testFirebaseConnection();

    // Área Administrativa
    const adminBtn = document.getElementById('admin-btn');
    const adminPanel = document.getElementById('admin-panel');
    const logoutBtn = document.getElementById('logout-btn');
    
    adminBtn.addEventListener('click', function() {
        adminPanel.classList.toggle('active');
    });
    
    logoutBtn.addEventListener('click', function() {
        alert('Saindo do sistema...');
        adminPanel.classList.remove('active');
    });
    
    // Navegação por semana
    const prevWeekBtn = document.getElementById('prev-week');
    const nextWeekBtn = document.getElementById('next-week');
    const todayBtn = document.getElementById('today');
    const currentWeekEl = document.getElementById('current-week');
    
    let currentDate = new Date();
    let volunteers = [];
    
    function updateWeekDisplay() {
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // Segunda-feira
        
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekEnd.getDate() + 6); // Domingo
        
        const options = { day: '2-digit', month: '2-digit' };
        const startStr = weekStart.toLocaleDateString('pt-BR', options);
        const endStr = weekEnd.toLocaleDateString('pt-BR', options);
        
        currentWeekEl.textContent = `Semana ${startStr} - ${endStr}`;
        
        // Carrega voluntários do Firebase para a semana atual
        loadVolunteersForWeek(weekStart);
    }
    
    function loadVolunteersForWeek(weekStart) {
        const weekKey = weekStart.toISOString().split('T')[0];
        
        database.ref('schedules/' + weekKey).on('value', (snapshot) => {
            const data = snapshot.val();
            if (data) {
                // Converte o objeto em array mantendo os IDs
                volunteers = Object.keys(data).map(key => ({
                    id: key, // Usa a chave do Firebase como ID
                    ...data[key]
                }));
            } else {
                volunteers = [];
            }
            renderVolunteers();
        }, (error) => {
            console.error("Erro ao carregar voluntários:", error);
            alert("Erro ao carregar dados dos voluntários");
        });
    }
    
    function saveVolunteersForWeek(weekStart) {
        const weekKey = weekStart.toISOString().split('T')[0];
        
        // Converte o array de voluntários para um objeto onde a chave é o ID
        const volunteersObj = {};
        volunteers.forEach(vol => {
            const volId = vol.id || database.ref('schedules/' + weekKey).push().key;
            volunteersObj[volId] = {
                name: vol.name,
                phone: vol.phone,
                email: vol.email,
                shift: vol.shift,
                day: vol.day
            };
        });
        
        database.ref('schedules/' + weekKey).set(volunteersObj)
            .catch(error => {
                console.error("Erro ao salvar voluntários:", error);
                alert("Erro ao salvar dados no banco de dados");
            });
    }
    
    prevWeekBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() - 7);
        updateWeekDisplay();
    });
    
    nextWeekBtn.addEventListener('click', function() {
        currentDate.setDate(currentDate.getDate() + 7);
        updateWeekDisplay();
    });
    
    todayBtn.addEventListener('click', function() {
        currentDate = new Date();
        updateWeekDisplay();
    });
    
    // Gerenciamento de voluntários
    const volunteerForm = document.getElementById('volunteer-form');
    const formTitle = document.getElementById('form-title');
    const addVolunteerBtns = document.querySelectorAll('.add-volunteer');
    const cancelVolunteerBtn = document.getElementById('cancel-volunteer');
    const saveVolunteerBtn = document.getElementById('save-volunteer');
    const volShiftInput = document.getElementById('vol-shift');
    const volDayInput = document.getElementById('vol-day');
    const volNameInput = document.getElementById('vol-name');
    const volPhoneInput = document.getElementById('vol-phone');
    const volEmailInput = document.getElementById('vol-email');
    const exportBtn = document.getElementById('export-btn');
    
    let currentCell = null;
    let isEditing = false;
    let currentVolunteerId = null;
    
    function renderVolunteers() {
        // Limpa todos os voluntários das células
        document.querySelectorAll('.volunteer-name').forEach(el => el.remove());
        
        // Adiciona os voluntários nas células correspondentes
        volunteers.forEach(vol => {
            const cell = document.querySelector(`.schedule-cell[data-shift="${vol.shift}"][data-day="${vol.day}"]`);
            if (cell) {
                const volunteerNameEl = document.createElement('div');
                volunteerNameEl.className = 'volunteer-name';
                volunteerNameEl.textContent = vol.name;
                
                // Adiciona tooltip com informações completas
                volunteerNameEl.title = `Nome: ${vol.name}\nTelefone: ${vol.phone}\nEmail: ${vol.email}`;
                
                cell.insertBefore(volunteerNameEl, cell.querySelector('.add-volunteer'));
            }
        });
        
        const volunteerList = document.getElementById('volunteer-list');
        volunteerList.innerHTML = '<h3>Todos os Voluntários</h3>';
        
        if (volunteers.length === 0) {
            volunteerList.innerHTML += '<p>Nenhum voluntário cadastrado para esta semana.</p>';
            return;
        }
        
        volunteers.forEach(vol => {
            const shiftName = 
                vol.shift === 'morning' ? 'Manhã' : 
                vol.shift === 'afternoon' ? 'Tarde' : 'Noite';
            
            const volunteerItem = document.createElement('div');
            volunteerItem.className = 'volunteer-item';
            volunteerItem.innerHTML = `
                <div class="volunteer-info">
                    <div class="volunteer-name">${vol.name}</div>
                    <div class="volunteer-details">${shiftName} - ${vol.day} | ${vol.phone} | ${vol.email}</div>
                </div>
                <div class="volunteer-actions">
                    <button class="action-btn edit-btn" data-id="${vol.id}">Editar</button>
                    <button class="action-btn delete-btn" data-id="${vol.id}">Remover</button>
                </div>
            `;
            volunteerList.appendChild(volunteerItem);
        });
        
        // Adiciona eventos aos botões de edição e remoção
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', handleEditVolunteer);
        });
        
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', handleDeleteVolunteer);
        });
    }
    
    function handleAddVolunteer() {
        currentCell = this.parentElement;
        const shift = currentCell.getAttribute('data-shift');
        const day = currentCell.getAttribute('data-day');
        
        let shiftName = '';
        switch(shift) {
            case 'morning': shiftName = 'Manhã'; break;
            case 'afternoon': shiftName = 'Tarde'; break;
            case 'evening': shiftName = 'Noite'; break;
        }
        
        volShiftInput.value = shiftName;
        volDayInput.value = day;
        
        // Limpar formulário
        volNameInput.value = '';
        volPhoneInput.value = '';
        volEmailInput.value = '';
        
        // Configurar como adição
        isEditing = false;
        currentVolunteerId = null;
        formTitle.textContent = 'Adicionar Voluntário';
        
        // Exibir formulário
        volunteerForm.style.display = 'block';
        window.scrollTo({
            top: volunteerForm.offsetTop - 20,
            behavior: 'smooth'
        });
    }
    
    function handleEditVolunteer() {
        const id = this.getAttribute('data-id');
        const vol = volunteers.find(v => v.id === id);
        
        if (!vol) return;
        
        // Encontrar a célula correspondente
        const cell = document.querySelector(`.schedule-cell[data-shift="${vol.shift}"][data-day="${vol.day}"]`);
        if (cell) currentCell = cell;
        
        let shiftName = '';
        switch(vol.shift) {
            case 'morning': shiftName = 'Manhã'; break;
            case 'afternoon': shiftName = 'Tarde'; break;
            case 'evening': shiftName = 'Noite'; break;
        }
        
        // Preencher formulário
        volShiftInput.value = shiftName;
        volDayInput.value = vol.day;
        volNameInput.value = vol.name;
        volPhoneInput.value = vol.phone;
        volEmailInput.value = vol.email;
        
        // Configurar como edição
        isEditing = true;
        currentVolunteerId = id;
        formTitle.textContent = 'Editar Voluntário';
        
        // Exibir formulário
        volunteerForm.style.display = 'block';
        window.scrollTo({
            top: volunteerForm.offsetTop - 20,
            behavior: 'smooth'
        });
    }
    
    function handleDeleteVolunteer() {
        if (confirm('Tem certeza que deseja remover este voluntário?')) {
            const id = this.getAttribute('data-id');
            volunteers = volunteers.filter(v => v.id !== id);
            
            const weekStart = new Date(currentDate);
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
            saveVolunteersForWeek(weekStart);
            
            renderVolunteers();
        }
    }
    
    function saveVolunteer() {
        const name = volNameInput.value.trim();
        const phone = volPhoneInput.value.trim();
        const email = volEmailInput.value.trim();
        const shift = currentCell.getAttribute('data-shift');
        const day = currentCell.getAttribute('data-day');
        
        if (!name) {
            alert('Por favor, insira o nome do voluntário');
            return;
        }
        
        const weekStart = new Date(currentDate);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1);
        
        if (isEditing) {
            // Atualizar voluntário existente
            const volIndex = volunteers.findIndex(v => v.id === currentVolunteerId);
            if (volIndex !== -1) {
                volunteers[volIndex] = {
                    id: currentVolunteerId,
                    name,
                    phone,
                    email,
                    shift,
                    day
                };
            }
        } else {
            // Adicionar novo voluntário
            const newId = database.ref('schedules').push().key; // Gera um ID único do Firebase
            volunteers.push({
                id: newId,
                name,
                phone,
                email,
                shift,
                day
            });
        }
        
        saveVolunteersForWeek(weekStart);
        renderVolunteers();
        volunteerForm.style.display = 'none';
        currentCell = null;
    }
    
    function exportData() {
        // Criar um elemento temporário para renderizar o relatório
        const tempDiv = document.createElement('div');
        tempDiv.style.width = '800px';
        tempDiv.style.padding = '20px';
        tempDiv.style.backgroundColor = 'white';
        tempDiv.style.position = 'absolute';
        tempDiv.style.left = '-9999px';
        
        // Criar cabeçalho do relatório
        const header = document.createElement('div');
        header.innerHTML = `
            <h2 style="text-align: center; color: #333; margin-bottom: 20px;">
                Escala de Voluntários - ${currentWeekEl.textContent}
            </h2>
            <div style="text-align: right; color: #666; margin-bottom: 20px;">
                Gerado em: ${new Date().toLocaleDateString('pt-BR')}
            </div>
        `;
    
        // Criar tabela de horários
        const table = document.createElement('table');
        table.style.width = '100%';
        table.style.borderCollapse = 'collapse';
        table.style.marginBottom = '20px';
        
        // Cabeçalho da tabela
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background-color: #4CAF50; color: white;">
                <th style="padding: 10px; border: 1px solid #ddd;">Turno</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Seg</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Ter</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Qua</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Qui</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Sex</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Sáb</th>
                <th style="padding: 10px; border: 1px solid #ddd;">Dom</th>
            </tr>
        `;
        table.appendChild(thead);
    
        // Corpo da tabela
        const shifts = ['morning', 'afternoon', 'evening'];
        const shiftNames = {
            morning: 'Manhã',
            afternoon: 'Tarde',
            evening: 'Noite'
        };
    
        shifts.forEach(shift => {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td style="padding: 10px; border: 1px solid #ddd; font-weight: bold;">${shiftNames[shift]}</td>`;
            
            ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].forEach(day => {
                const volunteer = volunteers.find(v => v.shift === shift && v.day === day);
                tr.innerHTML += `
                    <td style="padding: 10px; border: 1px solid #ddd;">
                        ${volunteer ? volunteer.name : '-'}
                    </td>
                `;
            });
            
            table.appendChild(tr);
        });
    
        // Montar relatório completo
        tempDiv.appendChild(header);
        tempDiv.appendChild(table);
        document.body.appendChild(tempDiv);
    
        // Usar html2canvas para converter para imagem
        html2canvas(tempDiv, {
            scale: 2, // Melhor qualidade
            backgroundColor: 'white'
        }).then(canvas => {
            // Criar link de download
            const link = document.createElement('a');
            link.download = `escala-voluntarios-${new Date().toISOString().split('T')[0]}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
    
            // Limpar
            document.body.removeChild(tempDiv);
        });
    }
    
    // Adiciona eventos aos botões
    addVolunteerBtns.forEach(btn => {
        btn.addEventListener('click', handleAddVolunteer);
    });
    
    cancelVolunteerBtn.addEventListener('click', function() {
        volunteerForm.style.display = 'none';
        currentCell = null;
    });
    
    saveVolunteerBtn.addEventListener('click', saveVolunteer);
    exportBtn.addEventListener('click', exportData);
    
    // Sistema de Tarefas
    const shiftButtons = document.querySelectorAll('.shift-btn');
    const shiftSections = document.querySelectorAll('.shift-section');
    
    shiftButtons.forEach(button => {
        button.addEventListener('click', function() {
            const shift = this.getAttribute('data-shift');
            
            shiftButtons.forEach(btn => btn.classList.remove('active'));
            shiftSections.forEach(section => section.classList.remove('active'));
            
            this.classList.add('active');
            document.querySelector(`.shift-section.${shift}`).classList.add('active');
            updateProgress();
        });
    });
    
    // Mostrar/ocultar fotos
    const photoButtons = document.querySelectorAll('.photo-btn');
    photoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const container = this.nextElementSibling;
            container.style.display = container.style.display === 'block' ? 'none' : 'block';
        });
    });
    
    // Tirar fotos (simulação)
    const takePhotoButtons = document.querySelectorAll('.take-photo');
    takePhotoButtons.forEach(button => {
        button.addEventListener('click', function() {
            const type = this.getAttribute('data-type');
            const preview = this.parentElement.querySelector('.photo-preview');
            
            // Em um app real, aqui você chamaria a API da câmera
            preview.innerHTML = `<img src="https://via.placeholder.com/300x150?text=Foto+${type === 'before' ? 'Antes' : 'Depois'}" alt="Foto ${type === 'before' ? 'Antes' : 'Depois'}">`;
        });
    });
    
    // Atualizar progresso
    const checkboxes = document.querySelectorAll('.task-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            if (this.checked) {
                taskItem.classList.add('task-completed');
            } else {
                taskItem.classList.remove('task-completed');
            }
            updateProgress();
        });
    });
    
    function updateProgress() {
        const activeSection = document.querySelector('.shift-section.active');
        if (!activeSection) return;
        
        const tasks = activeSection.querySelectorAll('.task-item');
        const completedTasks = activeSection.querySelectorAll('.task-completed');
        
        const progress = (completedTasks.length / tasks.length) * 100;
        document.querySelector('.progress').style.width = `${progress}%`;
        document.querySelector('.progress-text').textContent = `${Math.round(progress)}% completo`;
    }
    
    // Botão Salvar Progresso
    document.getElementById('save-progress-btn').addEventListener('click', function() {
        const activeSection = document.querySelector('.shift-section.active');
        if (!activeSection) return;

        const volunteerName = prompt("Nome do voluntário:");
        if (!volunteerName) {
            alert("Por favor, informe seu nome!");
            return;
        }

        const cashAmount = prompt("Valor em caixa (R$):");
        if (!cashAmount) {
            alert("Por favor, informe o valor em caixa!");
            return;
        }

        let inventoryStatus = prompt("O inventário está OK? Digite 1 para OK, 2 para itens faltando:");
        if (inventoryStatus === "2") {
            const missingItems = prompt("Quais itens estão faltando? (separe por vírgulas)");
            inventoryStatus = missingItems ? `⚠️ Faltando: ${missingItems}` : "⚠️ Pendente";
        } else {
            inventoryStatus = "✅ OK";
        }

        const observations = document.getElementById('shift-observations').value.trim();

        const turnName = activeSection.querySelector('h2').textContent;
        const tasks = activeSection.querySelectorAll('.task-item');
        const completedTasks = Array.from(tasks).filter(task => 
            task.querySelector('.task-checkbox').checked
        );
        const progress = Math.round((completedTasks.length / tasks.length) * 100);

        // Criar mensagem formatada
        let message = `*📋 Relatório de Tarefas - ${turnName}*\n`;
        message += `📅 Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
        message += `⏰ Horário: ${new Date().toLocaleTimeString('pt-BR')}\n\n`;
        message += `👤 Voluntário: ${volunteerName}\n`;
        message += `💰 Caixa: R$ ${Number(cashAmount.replace(',', '.')).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `📦 Inventário: ${inventoryStatus}\n\n`;

        // Adicionar movimentos de quartos se houver
        const movements = document.querySelectorAll('.movement-item');
        if (movements.length > 0) {
            message += `*🔄 Check-ins/Check-outs:*\n`;
            movements.forEach(movement => {
                const text = movement.querySelector('span').textContent;
                message += `• ${text}\n`;
            });
            message += '\n';
        }

        // Adicionar tarefas concluídas
        message += `*✅ Tarefas Concluídas:*\n`;
        completedTasks.forEach(task => {
            const text = task.querySelector('.task-text').textContent;
            const shortText = taskShortNames[text] || text;
            message += `${shortText}\n`;
        });

        // Adicionar observações se houver (incluindo justificativas para tarefas não realizadas)
        if (observations) {
            message += `\n*📝 Observações/Justificativas:*\n${observations}\n`;
        }

        // Copiar para área de transferência
        try {
            navigator.clipboard.writeText(message).then(() => {
                alert('Relatório copiado! Cole no WhatsApp.');
            });
        } catch (err) {
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = message;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            document.execCommand('copy');
            document.body.removeChild(tempTextArea);
            alert('Relatório copiado! Cole no WhatsApp.');
        }

        // Limpar observações após enviar
        document.getElementById('shift-observations').value = '';

        // Salvar estado no Firebase
        const reportData = {
            date: new Date().toISOString(),
            volunteer: volunteerName,
            cashAmount: cashAmount,
            shift: turnName,
            progress: progress,
            tasks: Array.from(tasks).map(task => ({
                text: task.querySelector('.task-text').textContent,
                completed: task.querySelector('.task-checkbox').checked
            })),
            inventoryStatus: inventoryStatus,
            observations: observations
        };

        database.ref('reports').push(reportData)
            .then(() => console.log("Relatório salvo no Firebase"))
            .catch(error => console.error("Erro ao salvar relatório:", error));
    });

    // Adicione este código para os botões de turno
    document.querySelectorAll('.shift-btn').forEach(button => {
        button.addEventListener('click', function() {
            const shift = this.dataset.shift;
            
            // Remover active de todos os botões e seções
            document.querySelectorAll('.shift-btn').forEach(btn => 
                btn.classList.remove('active')
            );
            document.querySelectorAll('.shift-section').forEach(section => 
                section.classList.remove('active')
            );
            
            // Adicionar active ao botão e seção clicados
            this.classList.add('active');
            document.querySelector(`.shift-section.${shift}`).classList.add('active');
            
            // Atualizar barra de progresso
            updateProgress();
        });
    });

    // Adicionar evento de change para os checkboxes
    document.querySelectorAll('.task-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const taskItem = this.closest('.task-item');
            if (this.checked) {
                taskItem.classList.add('task-completed');
            } else {
                taskItem.classList.remove('task-completed');
            }
            updateProgress();
        });
    });
    
    // Inicialização
    updateWeekDisplay();
    document.querySelector('.shift-btn[data-shift="morning"]').click();
});

const taskShortNames = {
    // Tarefas Gerais (Para todos os turnos)
    "Completar todos os checklists da recepção (avise o próximo voluntário caso não consiga terminar alguma atividade)": "• Checklist da recepção completo ✅",
    "Vender produtos da recepção e receber pagamentos na hora para não criar dívidas": "• Vendas da recepção realizadas ✅",
    "Passar perfume e ligar a luminária dos quartos com Check-in ao menos 30 minutos antes da chegada": "• Quartos preparados para check-in ✅",
    "Ficar sempre com o fone da recepção (utilizar a bolsa preta)": "• Telefone na bolsa em uso ✅",
    "Usar Resear como produto nos vidros dos boxes dos banheiros": "• Boxes dos banheiros limpos ✅",
    "Manter arrumado o sofá da sala e mesas da sala de alimentação": "• Sala de alimentação organizada ✅",
    "Em caso de dúvida no check-in, verificar a lista atrás do computador ou avisos na bancada": "• Avisos do check-in verificados ✅",

    // Tarefas Manhã (7:30-13:00)
    "Enviar mensagem no grupo STAFF de abertura de turno": "• Mensagem de abertura enviada ✅",
    "Abrir a porta da recepção e o terraço (7:30-10:00)": "• Portas e terraço abertos ✅",
    "Fazer o café e colocar bolachas e itens na bancada": "• Café e bolachas servidos ✅",
    "Guardar tudo ao meio dia (encher o pote de bolachas antes)": "• Café e bolachas guardados ✅",
    "Ligar o computador da sala e colocar música ambiente em volume baixo": "• Música ambiente ligada ✅",
    "Varrer a área da frente, dos fundos e terraço (molhar as plantas)": "• Áreas varridas e plantas regadas ✅",
    "Fazer login no sistema, verificar check-ins e check-outs do dia": "• Sistema verificado e atualizado ✅",
    "Abrir o POS (abrir caixa) para contar dinheiro e fazer inventário dos produtos": "• Caixa aberto e contado ✅",
    "Verificar caixinha do \"Check-out Express\" antes de subir para os quartos": "• Check-out Express verificado ✅",
    "Limpar ou enxugar os banheiros (boxes, lixos, repor papel)": "• Banheiros limpos e organizados ✅",
    "Abrir quartos sem hóspedes para arejar (verificar se precisa organizar/limpar)": "• Quartos arejados e verificados ✅",
    "Retirar lençóis dos quartos de check-out que saírem antes das 11h": "• Lençóis dos check-outs retirados ✅",
    "Passar pano com álcool nas mesas do refeitório e balcão": "• Mesas higienizadas ✅",
    "Varrer os tapetes de entrada, da cozinha e dos banheiros": "• Tapetes varridos e limpos ✅",
    "Lavar no tanque os panos de limpeza usados e pendurar na varanda": "• Panos de limpeza lavados ✅",
    "Secar e guardar louças do escorredor": "• Louças secas e guardadas ✅",
    "Encerrar o turno passando informações para o próximo voluntário": "• Informações passadas ao próximo ✅",
    "Enviar relatório de encerramento no grupo STAFF (nº hóspedes, valor no caixa, recados)": "• Relatório final enviado ✅",
    "Deslogar do POS e do sistema": "• Sistema e POS fechados ✅",

    // Tarefas Tarde (13:00-18:00)
    "Enviar mensagem no grupo STAFF (tarde)": "• Mensagem tarde enviada ✅",
    "Verificar se os quartos que estão aguardando check-ins estão OK": "• Quartos de check-in verificados ✅",
    "Varrer o corredor, escadas e piso do quarto compartilhado": "• Corredores e escadas limpos ✅",
    "Verificar se precisa passar pano com produto no piso da sala e/ou cozinha": "• Pisos limpos com produto ✅",
    "Ajudar na lavanderia com as roupas de cama quando necessário": "• Roupas de cama organizadas ✅",

    // Tarefas Noite (18:00-23:30)
    "Enviar mensagem no grupo STAFF (noite)": "• Mensagem noite enviada ✅",
    "Juntar os lixos e retirar os sacos que estiverem na entrada (usar alarme às 19:00)": "• Lixo recolhido e retirado ✅",
    "Verificar se os quartos que estão aguardando check-ins estão OK": "• Quartos de check-in verificados ✅",
    "Encerrar o turno deixando informações para o próximo voluntário": "• Informações passadas ✅",

    // Procedimentos de Fechamento
    "Retirar o filtro da tomada e trancar o cadeado do escritório": "• Filtro desligado e escritório fechado ✅",
    "Colocar máquinas de cartões, celular e fone sem fio do hostel para carregar": "• Equipamentos carregando ✅",
    "Fazer a última contagem do caixa do dia": "• Caixa final conferido ✅",
    "Verificar se o freezer de bebidas e o estoque de doces/diversos estão trancados": "• Freezer e estoque trancados ✅",
    "Fechar com chave a porta da varanda (orientar hóspedes a fechar após o uso)": "• Porta da varanda trancada ✅",
    "Desligar os computadores (colocar revistas sobre o computador da recepção)": "• Computadores desligados ✅",
    "Apagar as luzes da recepção, cozinha e fundos": "• Luzes apagadas ✅",
    "Guardar as chaves do hostel e do quadro de chaves na recepção": "• Chaves guardadas ✅",
    "Virar a plaquinha da corrente para o lado \"fechado\" ao finalizar": "• Placa de fechado virada ✅"
};

// Adicione ao seu JavaScript existente
document.querySelectorAll('.movement-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.movement-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
    });
});

document.getElementById('add-movement').addEventListener('click', function() {
    const room = document.getElementById('room-select');
    if (!room.value) {
        alert('Selecione um quarto');
        return;
    }

    const isCheckin = document.querySelector('.checkin-btn').classList.contains('active');
    const type = isCheckin ? 'Check-in' : 'Check-out';
    const roomText = room.options[room.selectedIndex].text;

    const movementItem = document.createElement('div');
    movementItem.className = `movement-item ${isCheckin ? 'checkin' : 'checkout'}`;
    movementItem.innerHTML = `
        <span>${type}: ${roomText}</span>
        <button class="remove-movement" onclick="this.parentElement.remove()">×</button>
    `;

    document.querySelector('.movements-list').appendChild(movementItem);
    room.value = '';
});
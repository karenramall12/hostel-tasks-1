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
    
    document.querySelectorAll('.task-item').forEach(item => {
        item.addEventListener('click', function(e) {
            // Evita duplo clique no checkbox
            if (e.target.tagName.toLowerCase() !== 'input') {
                const checkbox = item.querySelector('.task-checkbox');
                checkbox.checked = !checkbox.checked;
                checkbox.dispatchEvent(new Event('change'));
            }
        });
    });
    
    function updateProgress() {
        // Identifica qual turno está ativo
        const activeShift = document.querySelector('.shift-section.active');
        if (!activeShift) return;

        // Conta apenas as checkboxes do turno ativo
        const checkboxes = activeShift.querySelectorAll('.task-checkbox');
        const checked = activeShift.querySelectorAll('.task-checkbox:checked');
        
        if (checkboxes.length > 0) {
            const percentage = (checked.length / checkboxes.length) * 100;
            const progressBar = document.querySelector('.progress');
            const progressText = document.querySelector('.progress-text');
            
            if (progressBar && progressText) {
                progressBar.style.width = percentage + '%';
                progressText.textContent = Math.round(percentage) + '% completo';
            }
        }
    }

    // Atualiza o progresso quando trocar de turno
    document.querySelectorAll('.shift-btn').forEach(button => {
        button.addEventListener('click', function() {
            // Aguarda um momento para a troca de turno ser concluída
            setTimeout(updateProgress, 100);
        });
    });
    
    // Atualiza quando marcar/desmarcar tarefas
    document.addEventListener('DOMContentLoaded', function() {
        document.querySelectorAll('.task-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', updateProgress);
        });
        // Atualiza progresso inicial
        updateProgress();
    });
    
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
    
    // Voluntários no localStorage
    function getVolunteers() {
        return JSON.parse(localStorage.getItem('volunteers') || '[]');
    }
    function saveVolunteers(vols) {
        localStorage.setItem('volunteers', JSON.stringify(vols));
    }

    // Cadastro de voluntário (apenas nome e cor)
    document.getElementById('add-volunteer-btn').onclick = function() {
        const name = document.getElementById('vol-name').value.trim();
        const color = document.querySelector('input[name="vol-color"]:checked').value;
        if (!name) return alert('Digite o nome do voluntário!');
        const vols = JSON.parse(localStorage.getItem('volunteers') || '[]');
        vols.push({ name, color });
        localStorage.setItem('volunteers', JSON.stringify(vols));
        document.getElementById('vol-name').value = '';
        alert('Voluntário salvo!');
    };

    // Gerenciamento de Voluntários
    class VolunteerManager {
        constructor() {
            this.volunteers = JSON.parse(localStorage.getItem('volunteers') || '[]');
            this.setupEventListeners();
            this.updateVolunteersList();
        }

        setupEventListeners() {
            document.getElementById('save-volunteer-btn').addEventListener('click', () => {
                this.addVolunteer();
            });

            // Permite usar Enter para salvar
            document.getElementById('new-volunteer-name').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.addVolunteer();
                }
            });
        }

        addVolunteer() {
            const nameInput = document.getElementById('new-volunteer-name');
            const name = nameInput.value.trim();
            const color = document.querySelector('input[name="volunteer-color"]:checked').value;

            if (!name) {
                alert('Por favor, digite o nome do voluntário');
                return;
            }

            // Verifica se já existe
            if (this.volunteers.some(v => v.name.toLowerCase() === name.toLowerCase())) {
                alert('Este voluntário já está cadastrado');
                return;
            }

            // Adiciona novo voluntário
            this.volunteers.push({ name, color });
            this.saveVolunteers();
            this.updateVolunteersList();

            // Limpa o campo
            nameInput.value = '';
            alert('Voluntário cadastrado com sucesso!');
        }

        removeVolunteer(index) {
            if (confirm('Tem certeza que deseja remover este voluntário?')) {
                this.volunteers.splice(index, 1);
                this.saveVolunteers();
                this.updateVolunteersList();
            }
        }

        saveVolunteers() {
            localStorage.setItem('volunteers', JSON.stringify(this.volunteers));
        }

        updateVolunteersList() {
            const list = document.getElementById('volunteers-list');
            list.innerHTML = '';

            this.volunteers.forEach((volunteer, index) => {
                const li = document.createElement('li');
                li.style.backgroundColor = volunteer.color;
                
                li.innerHTML = `
                    ${volunteer.name}
                    <button class="remove-btn" onclick="volunteerManager.removeVolunteer(${index})">
                        ✕
                    </button>
                `;
                
                list.appendChild(li);
            });
        }
    }

    // Inicializa o gerenciador quando a página carregar
    document.addEventListener('DOMContentLoaded', () => {
        window.volunteerManager = new VolunteerManager();
    });
    
    // Inicialização
    updateWeekDisplay();
    document.querySelector('.shift-btn[data-shift="morning"]').click();
});

const taskShortNames = {
    // Gerais
    "Completar todos os checklists da recepção (avise o próximo voluntário caso não consiga terminar alguma atividade)": "• Checklist recepção ✅",
    "Vender produtos da recepção e receber pagamentos na hora para não criar dívidas": "• Produtos pagos ✅",
    "Passar perfume e ligar a luminária dos quartos com Check-in ao menos 30 minutos antes da chegada": "• Quartos perfumados ✅",
    "Ficar sempre com o fone da recepção (utilizar a bolsa preta)": "• Fone da recepção ✅",
    "Usar Resear como produto nos vidros dos boxes dos banheiros": "• Vidros dos boxes limpos ✅",
    "Manter arrumado o sofá da sala e mesas da sala de alimentação": "• Sofá e mesas arrumados ✅",
    "Em caso de dúvida no check-in, verificar a lista atrás do computador ou avisos na bancada": "• Check-in verificado ✅",

    // Manhã
    "Abertura de Turno (Mensagem no grupo)": "• Abertura de turno ✅",
    "Fazer Login do sistema, verificar Check-ins e Check-outs do dia": "• Sistema verificado ✅",
    "Abrir o POS (abrir caixa) para contar dinheiro": "• Caixa aberto ✅",
    "Abrir a Porta da Recepção e do Terraço para arejar": "• Portas abertas ✅",
    "Ligar o computador da sala (deixar na tela o site do Hostel)": "• Computador ligado ✅",
    "Colocar música ambiente pelo celular (Bluethooth) em volume baixo": "• Música ligada ✅",
    "Guardar Louças que estiverem no Escorredor": "• Louças guardadas ✅",
    "Fazer o Café, colocar Pote de Bolachas e Açucar na bancada": "• Café preparado ✅",
    "Oferecer um cafezinho aos nossos Hóspedes": "• Café oferecido ✅",
    "Vasos sanitários (utilizar a escova própria com desinfetante)": "• Vasos limpos ✅",
    "Esvaziar os cestos de lixos": "• Lixos esvaziados ✅",
    "Varrer tapetes do banheiro e/ou trocar toalhas de piso, se necessário": "• Tapetes/toalhas ok ✅",
    "Pias e torneiras (Enxugar ou limpar com pano de microfibra)": "• Pias/torneiras limpas ✅",
    "Piso do Box (retirar cabelos e limpar com detergente)": "• Box limpo ✅",
    "Passar nos Vidros dos Boxes, Espelhos e Torneiras o pano de Microfibra": "• Vidros/espelhos limpos ✅",
    "Piso do Banheiro – (Passar pano com desinfetante)": "• Piso banheiro limpo ✅",
    "Retirar os itens esquecidos nos banheiros e deixar na salinha enviando fotos avisando o grupo": "• Achados/Perdidos ok ✅",
    "Varrer ou Enxugar a área da Frente, dos Fundos e Terraço": "• Áreas externas limpas ✅",
    "Molhar as Plantas da Entrada, Fundos e do Terraço": "• Plantas regadas ✅",
    "Retirar Lixos que estiverem cheios e trocar o saco": "• Lixos trocados ✅",
    "Verificar caixinha do “Check-out Express” antes de subir para os Quartos": "• Check-out Express ok ✅",
    "Verificar se os Quartos com previsão de Check-ins estão limpos e arrumados": "• Quartos check-in ok ✅",
    "Fazer limpeza e arrumação dos quartos que já fizeram Check-out": "• Quartos check-out limpos ✅",
    "Pano com álcool nas mesas do refeitório, Balcão e limpar o Fogão": "• Mesas/balcão/fogão limpos ✅",
    "Varrer os tapetes de Entrada, da Cozinha e dos Fundos": "• Tapetes limpos ✅",
    "Localizar Hóspede. Ficarão um pouco mais (1h) e/ou desejam Meia diária": "• Hóspedes localizados ✅",
    "Retirar o Café, Açucar, encher o pote de bolachas antes de guardar": "• Café/bolachas guardados ✅",
    "Secar e guardar louças dos Hóspedes deixadas no Escorredor": "• Louças hóspedes guardadas ✅",
    "Arrumação e Limpeza dos Quartos que tiveram Check-outs": "• Quartos arrumados ✅",
    "Mesmas atividades das 7h45. (VIDE ATIVIDADES ACIMA)": "• Segunda limpeza banheiros ✅",
    "Lavar os panos de limpeza que utilizou após o uso e pendurar na varanda": "• Panos lavados ✅",
    "Manter o cesto com produtos de Limpeza e os Panos do armario da Lavanderia organizados": "• Produtos/panos organizados ✅",
    "Fazer a contagem do Inventário junto com o próximo voluntário": "• Inventário contado ✅",
    "Fechar os quartos que estavam abertos para arejar": "• Quartos fechados ✅",
    "Passar informações ou Recados ao próximo Voluntário": "• Informações passadas ✅",
    "Deslogar do POS e do Sistema": "• Sistema deslogado ✅",

    // Tarde
    "Fazer Login no Sistema, verificar Check-ins e Check-outs do dia": "• Sistema verificado ✅",
    "Varrer ou passar rodo na área da frente, dos Fundos e Terraço": "• Áreas externas limpas ✅",
    "Varrer o Corredor dos Quartos Privativos, Piso do Quarto compartilhado e Escadas": "• Corredor/quartos/escadas limpos ✅",
    "Verificar se precisa passar um pano com produto no piso da Sala e/ou Cozinha": "• Piso sala/cozinha limpo ✅",
    "Varrer os tapetes de Entrada, da Cozinha e dos Banheiros com vassoura": "• Tapetes limpos ✅",
    "Secar e guardar louças dos Hóspedes deixadas no escorredor": "• Louças hóspedes guardadas ✅",
    "Mesmas atividades das 13h30. (VIDE ATIVIDADES ACIMA)": "• Segunda limpeza banheiros ✅",

    // Noite
    "Fazer Login no sistema, verificar Check-ins e Check-outs do dia": "• Sistema verificado ✅",
    "Verificar se os Quartos que estão aguardando Check-ins estão “Ok”": "• Quartos aguardando check-in ok ✅",
    "Colocar sacos de Lixos que estiverem no Cesto Preto da entrata na rua para coleta": "• Lixo para coleta ✅",
    "Aguardar os hóspedes dos Check-ins que constam no Sistema": "• Check-ins aguardados ✅",
    "Mesmas atividades das 19H45. (VIDE ATIVIDADES ACIMA)": "• Segunda limpeza banheiros ✅",
    "Verificar e Informar no grupo Staff se ainda há Hóspede que não realizou o Checkin": "• Check-in pendente informado ✅",
    "Secar e guardar as louças deixadas pelos Hóspedes no Escorredor": "• Louças hóspedes guardadas ✅",
    "Verificar se o freezer de bebidas e o estoque dos doces/diversos estão trancados": "• Freezer/estoque trancados ✅",
    "Trancar a Porta da Varanda (caso tenha hóspede, orientá-lo a fechar após o uso)": "• Porta da varanda trancada ✅",
    "Desligar os 2 computadores (coloque as revistas por cima do notebook e apague a luz da luminária)": "• Computadores desligados ✅",
    "Apagar as Luzes da Recepção e Luzes decorativas do balcão da cozinha": "• Luzes apagadas ✅",
    "Vire a plaquinha da corrente para o lado “fechado” ao finalizar o turno": "• Plaquinha virada ✅",
    "Verificar se as máquinas de cartões e celular da Recepção estão carregando": "• Máquinas/celular carregando ✅",
    "Colocar o fone sem Fio do Hostel na base para carregar": "• Fone carregando ✅",
    "Guardar o molho de chaves do Hostel no local combinado": "• Chaves guardadas ✅"
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
// Adicione tratamento de erro para o Firebase
database.ref('schedules').on('value', snapshot => {
    // sucesso
}, error => {
    console.error("Erro Firebase:", error);
    showErrorToast("Erro ao carregar dados");
});

// Função para mostrar erros
function showErrorToast(message) {
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}
// Ao salvar dados
function setLoading(loading) {
    document.getElementById('save-volunteer').disabled = loading;
    document.getElementById('save-volunteer').textContent = 
        loading ? 'Salvando...' : 'Salvar';
}

// Exemplo de uso
setLoading(true);
database.ref('schedules').set(data)
    .then(() => setLoading(false))
    .catch(error => {
        setLoading(false);
        showErrorToast("Erro ao salvar");
    });

const defaultTasks = {
    general: [
        "Completar todos os checklists da recepção (avise o próximo voluntário caso não consiga terminar alguma atividade)",
        "Vender produtos da recepção e receber pagamentos na hora para não criar dívidas"
    ],
    morning: [
        "Abertura de Turno (Mensagem no grupo)",
        "Fazer Login do sistema, verificar Check-ins e Check-outs do dia"
    ],
    afternoon: [
        "Abertura de Turno (Mensagem no grupo)"
    ],
    evening: [
        "Abertura de Turno (Mensagem no grupo)"
    ]
};

function getTasks() {
    return JSON.parse(localStorage.getItem('editTasks')) || defaultTasks;
}

function saveTasks(tasks) {
    localStorage.setItem('editTasks', JSON.stringify(tasks));
}

function renderTaskEditor(shift = 'general') {
    const tasks = getTasks();
    const list = document.getElementById('edit-task-list');
    list.innerHTML = '';
    (tasks[shift] || []).forEach((task, idx) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <input type="text" class="edit-task-input" value="${task}">
            <button class="remove-task-btn" data-idx="${idx}">Remover</button>
        `;
        list.appendChild(li);
    });
}

let currentEditorShift = 'general';

document.querySelectorAll('.editor-tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.editor-tab-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentEditorShift = this.dataset.shift;
        renderTaskEditor(currentEditorShift);
    });
});

document.getElementById('add-task-btn').onclick = function() {
    const input = document.getElementById('new-task-input');
    const value = input.value.trim();
    if (!value) return;
    const tasks = getTasks();
    tasks[currentEditorShift] = tasks[currentEditorShift] || [];
    tasks[currentEditorShift].push(value);
    saveTasks(tasks);
    input.value = '';
    renderTaskEditor(currentEditorShift);
};

document.getElementById('edit-task-list').onclick = function(e) {
    if (e.target.classList.contains('remove-task-btn')) {
        const idx = e.target.dataset.idx;
        const tasks = getTasks();
        tasks[currentEditorShift].splice(idx, 1);
        saveTasks(tasks);
        renderTaskEditor(currentEditorShift);
    }
};

document.getElementById('save-tasks-btn').onclick = function() {
    const tasks = getTasks();
    const inputs = document.querySelectorAll('.edit-task-input');
    tasks[currentEditorShift] = Array.from(inputs).map(input => input.value.trim()).filter(Boolean);
    saveTasks(tasks);
    alert('Tarefas salvas!');
    renderTaskEditor(currentEditorShift);
};

// Inicialização
renderTaskEditor(currentEditorShift);

// Salvar voluntários no localStorage
function getVolunteers() {
    return JSON.parse(localStorage.getItem('volunteers') || '[]');
}
function saveVolunteers(vols) {
    localStorage.setItem('volunteers', JSON.stringify(vols));
}

// Adicionar voluntário
document.getElementById('add-volunteer-btn').onclick = function() {
    const name = document.getElementById('vol-name').value.trim();
    const color = document.querySelector('input[name="vol-color"]:checked').value;
    if (!name) return alert('Digite o nome do voluntário!');
    const vols = JSON.parse(localStorage.getItem('volunteers') || '[]');
    vols.push({ name, color });
    localStorage.setItem('volunteers', JSON.stringify(vols));
    document.getElementById('vol-name').value = '';
    alert('Voluntário salvo!');
};

// Abrir modal ao clicar no +
document.querySelectorAll('.add-volunteer').forEach(btn => {
    btn.onclick = function() {
        const cell = this.closest('.schedule-cell');
        showVolunteerModal(cell);
    };
});

function showVolunteerModal(cell) {
    const modal = document.getElementById('select-volunteer-modal');
    const select = document.getElementById('volunteer-select');
    const colorPicker = document.getElementById('volunteer-color-picker');
    select.innerHTML = '';
    const vols = getVolunteers();
    vols.forEach((v, idx) => {
        const opt = document.createElement('option');
        opt.value = idx;
        opt.textContent = v.name;
        opt.style.background = v.color;
        select.appendChild(opt);
    });
    // Atualiza cor ao trocar voluntário
    select.onchange = function() {
        colorPicker.value = vols[select.value]?.color || "#F47B20";
    };
    // Cor padrão do selecionado
    colorPicker.value = vols[select.value]?.color || "#F47B20";
    // Confirmar escolha
    document.getElementById('confirm-volunteer').onclick = function() {
        const v = vols[select.value];
        if (!v) return;
        let vlist = cell.querySelector('.volunteer-list-cell');
        if (!vlist) {
            vlist = document.createElement('div');
            vlist.className = 'volunteer-list-cell';
            cell.insertBefore(vlist, cell.querySelector('.add-volunteer'));
        }
        vlist.innerHTML = `<span class="volunteer-badge" style="background:${colorPicker.value};">${v.name}</span>`;
        modal.style.display = 'none';
    };
    // Abrir modal
    modal.style.display = 'flex';
}

// Fechar modal
document.getElementById('close-modal').onclick = function() {
    document.getElementById('select-volunteer-modal').style.display = 'none';
};

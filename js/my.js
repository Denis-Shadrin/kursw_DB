
$(document).ready(function() {
    $('.show-description').click(function() {
        //console.log('Click event triggered');
        const doc_Id = $(this).prop('id');
        //console.log('ID!!!!!=', doc_Id);
        
        // Используйте doc_Id для формирования уникального селектора
        const descriptionContainer = $(`#documentTable${doc_Id} .description-content`);
        
        console.log('descriptionContainer:', descriptionContainer);
        
        $.ajax({
            url: `/getDescription/${doc_Id}`, 
            method: 'GET',
            success: function(response) {
                let table = `<table class="table table-bordered table-striped custom-table"><thead><tr><th>Подпись</th><th>Расторжение</th><th>Период</th><th>Курс</th><th>Полная стоимость</th><th>Остаточная стоимость</th><th>Срок оплаты</th><th>Реквизиты банка</th><th>Статус</th><th>Тип</th><th>Номер документа</th><th>Заказчик</th></tr></thead><tbody>`;
                response.forEach(item => {
                    table += `<tr><td>${item.podpis}</td><td>${item.rastor}</td><td>${item.period}</td><td>${item.kurs}</td><td>${item.poln}</td><td>${item.osr}</td><td>${item.sroc}</td><td>${item.rek}</td><td>${item.stat}</td><td>${item.tip}</td><td>${item.num}</td><td>${item.zak}</td></tr>`;
                });
                table += '</tbody></table>';
                descriptionContainer.html(table);
                descriptionContainer.show();

                // Добавьте стили для размера шрифта только к конкретной таблице
                descriptionContainer.find('.custom-table').css('font-size', '14px'); // Замените на нужный размер шрифта
                descriptionContainer.find('.custom-table th, .custom-table td').css('font-size', '14px'); // Замените на нужный размер шрифта
            },
            error: function(err) {
                console.error('Ошибка:', err);
            }
        });
        $(this).hide(); 
    });
	
	
	
});






/*

$(document).ready(function() {
    $('.show-description').click(function() {
        const mineralId = $(this).attr('id');
        const descriptionContainer = $(this).closest('.card-body').find('.description-content');
        $.ajax({
            url: `/getMineralDescription/${mineralId}`, 
            method: 'GET',
            success: function(response) {
                const descriptionText = `<span class="fw-bold">Описание: </span>${response}`;
                descriptionContainer.html(descriptionText);
                descriptionContainer.show();
            },
            error: function(err) {
                console.error('Ошибка:', err);
            }
        });
        $(this).hide(); 
    });
});

$(document).ready(function() {
    $('#addMineralForm').submit(function(event) {
        event.preventDefault(); 
        const formData = {
            MineralName: $('#MineralName').val(),
            MineralColor: $('#MineralColor').val(),
            MineralFormula: $('#MineralFormula').val(),
            MineralHardness: $('#MineralHardness').val(),
            MineralDescription: $('#MineralDescription').val()
        };
        console.log('DATA', formData);
        if (Object.values(formData).some(value => value === '')) {
            console.error('Заполните все обязательные поля');
            return;
        }
        $.ajax({
            url: '/add_form',
            method: 'POST',
            data: JSON.stringify(formData),
            processData: false,
            contentType: 'application/json',
            success: function(response) {
                console.log('Минерал успешно добавлен');
				window.location.href = '/admin_page';
            },
            error: function(xhr, status, error) {
               console.error('Ошибка:', error);
            }
        });
    });
});

$(document).ready(function() {
    $('.delete-btn').click(function(event) {
        event.preventDefault();
        const id = $(this).data('id');
        $.ajax({
            url: `/delete/${id}`,
            method: 'DELETE',
            success: function(response) {
                console.log('Элемент удален:', response);
                $(`.delete-btn[data-id="${id}"]`).closest('.row').remove();
            },
            error: function(xhr, status, error) {
                console.error('Ошибка:', error);
            }
        });
    });
});
*/
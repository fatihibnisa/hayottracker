import { Body, Controller, Delete, Get, HttpCode, Param, ParseIntPipe, Post, Put, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { CreateTodoDto, UpdateTodoDto } from './dto';

@ApiTags('todos')
@Controller('api/todos')
export class TodosController {
  constructor(private todos: TodosService) {}

  @Get()
  list(
    @Query('period') period?: 'daily' | 'weekly' | 'monthly',
    @Query('date') date?: string,
    @Query('done') done?: string,
  ) {
    return this.todos.list(period, date, done === undefined ? undefined : done === 'true' || done === '1');
  }

  @Post()
  create(@Body() dto: CreateTodoDto) {
    return this.todos.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateTodoDto) {
    return this.todos.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.todos.remove(id);
  }
}
